"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AttendanceRoster } from "@/components/attendance-roster"
import {
  BookOpen, Users, CalendarCheck, ChevronDown,
  Scan, BarChart3, Layers, GraduationCap, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useGetApiCourseOfferings } from "@/lib/api/course-offerings/course-offerings"
import { useGetApiCourseOfferingStaffs } from "@/lib/api/course-offering-staffs/course-offering-staffs"
import { useGetApiSections } from "@/lib/api/sections/sections"
import { useGetApiEnrollments } from "@/lib/api/enrollments/enrollments"
import { useGetApiSessions } from "@/lib/api/sessions/sessions"
import {
  useGetApiAttendancesMatrix,
  useGetApiAttendancesSessionSessionId,
} from "@/lib/api/attendances/attendances"
import { AttendanceMethod, AttendanceStatus } from "@/lib/api/model"
import type { CourseOfferingDto, SessionDto, AttendanceMatrixResult } from "@/lib/api/model"
import {
  MOCK_OFFERINGS, MOCK_SECTIONS, MOCK_SESSIONS,
  makeMockEnrollments, makeMockMatrix,
} from "@/lib/mock-data"

// ── Helpers ────────────────────────────────────────────────────────────────────

type CourseColor = "blue" | "violet" | "emerald"
const COLORS: CourseColor[] = ["blue", "violet", "emerald"]

const COLOR_MAP: Record<CourseColor, { bg: string; text: string; dot: string }> = {
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400",      dot: "bg-blue-500"    },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400",  dot: "bg-violet-500"  },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
}

function barColor(v: number) { return v >= 80 ? "bg-primary" : v >= 65 ? "bg-amber-500" : "bg-destructive" }
function textColor(v: number){ return v >= 80 ? "text-primary" : v >= 65 ? "text-amber-500" : "text-destructive" }

function courseOfferingHref(offeringId: number | string, params?: Record<string, number | string>) {
  const searchParams = new URLSearchParams({ from: "my-courses" })
  for (const [key, value] of Object.entries(params ?? {})) {
    searchParams.set(key, String(value))
  }
  return `/course-offerings/${encodeURIComponent(String(offeringId))}?${searchParams.toString()}`
}

function computeOverallPct(matrix: AttendanceMatrixResult): number {
  if (!matrix.students.length || !matrix.modules.length) return 0
  let total = 0, present = 0
  for (const student of matrix.students) {
    for (const status of student.attendanceStatuses) {
      total++
      if (status === AttendanceStatus.Present || status === AttendanceStatus.Late) present++
    }
  }
  return total > 0 ? Math.round((present / total) * 100) : 0
}

function computeModulePcts(matrix: AttendanceMatrixResult) {
  return matrix.modules.map((mod, i) => {
    const total   = matrix.students.length
    const present = matrix.students.filter(
      s => s.attendanceStatuses[i] === AttendanceStatus.Present ||
           s.attendanceStatuses[i] === AttendanceStatus.Late,
    ).length
    return { title: mod.title, pct: total > 0 ? Math.round((present / total) * 100) : 0 }
  })
}

// ── Last session roster sub-component ─────────────────────────────────────────

function LastSessionRoster({
  courseOfferingId,
  isMockMode,
}: {
  courseOfferingId: number | string
  isMockMode?: boolean
}) {
  const { data: apiSessions = [], isLoading: loadingSessions } = useGetApiSessions(
    { courseOfferingId },
    { query: { enabled: !isMockMode } },
  )

  const mockSessions = MOCK_SESSIONS.filter(s => {
    const ofId = Number(courseOfferingId)
    const mid  = Number(s.moduleId)
    return ofId === 9001 ? mid >= 100 && mid < 200
         : ofId === 9002 ? mid >= 200 && mid < 300
         : mid >= 300 && mid < 400
  })

  const sessions = isMockMode ? mockSessions : apiSessions

  const sorted  = [...sessions].sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
  )
  const last: SessionDto | undefined = sorted[0]

  const { data: attendances = [], isLoading: loadingAtt } = useGetApiAttendancesSessionSessionId(
    last?.id ?? 0,
    { query: { enabled: !!last?.id && !isMockMode } },
  )
  const { data: apiEnrollments = [], isLoading: loadingEnroll } = useGetApiEnrollments(
    { courseOfferingId },
    { query: { enabled: !isMockMode } },
  )

  const mockSecs    = MOCK_SECTIONS[String(courseOfferingId)] ?? []
  const enrollments = isMockMode
    ? makeMockEnrollments(Number(courseOfferingId), mockSecs, 45)
    : apiEnrollments

  const isLoading = isMockMode ? loadingSessions : (loadingSessions || loadingAtt || loadingEnroll)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!last) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No sessions taken for this course yet.
      </p>
    )
  }

  const filteredEnrollments = last.sectionId
    ? enrollments.filter(e => String(e.sectionId) === String(last.sectionId))
    : enrollments

  const presentAtts = isMockMode
    ? []
    : attendances.filter(a => a.status === AttendanceStatus.Present || a.status === AttendanceStatus.Late)

  const presentIds = new Set(presentAtts.map(a => String(a.userId)))

  const presentList = isMockMode
    ? filteredEnrollments.slice(0, Math.round(filteredEnrollments.length * 0.83)).map(e => ({
        id: e.userId, name: e.userName, studentId: String(e.userId), via: "auto" as const,
      }))
    : presentAtts.map(a => ({
        id: a.userId, name: a.userName, studentId: String(a.userId),
        via: a.method === AttendanceMethod.Manual ? ("manual" as const) : ("auto" as const),
        markedAt: a.recordedAt ?? undefined,
      }))

  const presentMockIds = new Set(presentList.map(p => String(p.id)))
  const absentList = filteredEnrollments
    .filter(e => isMockMode ? !presentMockIds.has(String(e.userId)) : !presentIds.has(String(e.userId)))
    .map(e => ({ id: e.userId, name: e.userName, studentId: String(e.userId) }))

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Last session ·{" "}
        <span className="font-medium">{last.moduleTitle}</span>
        {last.sectionName && <span> · {last.sectionName}</span>}
      </p>
      <AttendanceRoster present={presentList} absent={absentList} mode="full" />
    </div>
  )
}

// ── Course offering card ───────────────────────────────────────────────────────

function CourseOfferingCard({
  offering,
  colorIndex,
  isMockMode,
}: {
  offering:    CourseOfferingDto
  colorIndex:  number
  isMockMode?: boolean
}) {
  const router = useRouter()
  const [expanded,  setExpanded]  = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "roster">("overview")

  const color  = COLORS[colorIndex % COLORS.length]
  const colors = COLOR_MAP[color]

  const { data: apiMatrix }       = useGetApiAttendancesMatrix(
    { courseOfferingId: offering.id },
    { query: { enabled: expanded && !isMockMode } },
  )
  const { data: apiSections = [] } = useGetApiSections(
    { courseOfferingId: offering.id },
    { query: { enabled: expanded && !isMockMode } },
  )

  const mockSections = MOCK_SECTIONS[String(offering.id)] ?? []
  const mockMatrix   = expanded && isMockMode ? makeMockMatrix(Number(offering.id)) : undefined

  const matrix   = isMockMode ? mockMatrix   : apiMatrix
  const sections = isMockMode ? mockSections : apiSections

  const enrolledCount = matrix?.students.length ?? null
  const overallPct    = matrix ? computeOverallPct(matrix) : null
  const modulePcts    = matrix ? computeModulePcts(matrix) : []

  return (
    <Card className={cn("border transition-all duration-200", expanded && "shadow-md")}>
      {/* Header row */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", colors.bg)}>
          <BookOpen className={cn("h-5 w-5", colors.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={cn("font-mono font-bold text-base", colors.text)}>{offering.courseCode}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{offering.termCode}</Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{offering.courseTitle}</p>
        </div>

        <div className="hidden sm:flex items-center gap-6 shrink-0">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Students</p>
            <p className="text-sm font-bold">{enrolledCount ?? "-"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Avg Attendance</p>
            <p className={cn("text-sm font-bold tabular-nums", overallPct !== null ? textColor(overallPct) : "")}>
              {overallPct !== null ? `${overallPct}%` : "-"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Sections</p>
            <p className="text-sm font-bold">{sections.length || "-"}</p>
          </div>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t">
          {/* Tab bar */}
          <div className="flex border-b px-5 gap-1">
            {(["overview", "roster"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-2.5 px-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab === "overview" ? "Overview" : "Last Session Roster"}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5">
            {/* Overview tab */}
            {activeTab === "overview" && (
              <>
                {!matrix && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}

                {matrix && (
                  <>
                    {overallPct !== null && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Overall Attendance</span>
                          <span className={cn("font-bold tabular-nums", textColor(overallPct))}>
                            {overallPct}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", barColor(overallPct))}
                            style={{ width: `${overallPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Sections */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5" />Sections
                        </h4>
                        <div className="space-y-1.5">
                          {sections.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No sections</p>
                          ) : sections.map(sec => {
                            const count = matrix.students.filter(
                              s => String(s.currentSectionId) === String(sec.id),
                            ).length
                            return (
                              <button
                                key={String(sec.id)}
                                type="button"
                                onClick={() => router.push(courseOfferingHref(offering.id, { sectionId: sec.id }))}
                                className="flex w-full items-center gap-3 rounded-lg bg-muted/40 p-2.5 text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <div className={cn("h-2 w-2 rounded-full shrink-0", colors.dot)} />
                                <span className="text-sm font-medium flex-1">{sec.name}</span>
                                <span className="text-xs text-muted-foreground">{count} students</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Modules */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />Modules
                        </h4>
                        <div className="space-y-1.5">
                          {modulePcts.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No sessions yet</p>
                          ) : modulePcts.map((mod, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{mod.title}</p>
                              </div>
                              <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", barColor(mod.pct))}
                                  style={{ width: `${mod.pct}%` }}
                                />
                              </div>
                              <span className={cn("text-xs font-bold tabular-nums w-9 text-right", textColor(mod.pct))}>
                                {mod.pct}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Roster tab */}
            {activeTab === "roster" && (
              <LastSessionRoster
                courseOfferingId={offering.id}
                isMockMode={isMockMode}
              />
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t">
              <Button size="sm" variant="default" className="gap-2" onClick={() => router.push(courseOfferingHref(offering.id))}>
                <ChevronDown className="h-3.5 w-3.5 -rotate-90" />Details
              </Button>
              <Button size="sm" className="gap-2" onClick={() => router.push("/attendance")}>
                <Scan className="h-3.5 w-3.5" />Take Attendance
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => router.push(courseOfferingHref(offering.id, { tab: "sessions" }))}>
                <BarChart3 className="h-3.5 w-3.5" />View Sessions
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── My Courses page ────────────────────────────────────────────────────────────

export default function MyCoursesPage() {
  const router = useRouter()
  const { userId, isLoading: loadingUser } = useCurrentUser()

  const { data: allOfferings = [], isLoading: loadingOfferings } = useGetApiCourseOfferings()
  const { data: staffRecords = [], isLoading: loadingStaff }     = useGetApiCourseOfferingStaffs()

  const myOfferingIds = new Set(
    staffRecords
      .filter(s => String(s.userId) === String(userId))
      .map(s => String(s.courseOfferingId)),
  )
  const realOfferings = allOfferings.filter(o => myOfferingIds.has(String(o.id)))

  const isLoading   = loadingUser || loadingOfferings || loadingStaff
  const isMockMode  = !isLoading && realOfferings.length === 0
  const myOfferings = isMockMode ? MOCK_OFFERINGS : realOfferings

  return (
    <div className="max-w-screen-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${myOfferings.length} course${myOfferings.length !== 1 ? "s" : ""} assigned`}
          </p>
        </div>
        <Button onClick={() => router.push("/attendance")} className="gap-2 shrink-0">
          <Scan className="h-4 w-4" />Take Attendance
        </Button>
      </div>

      {/* Summary cards */}
      {!isLoading && myOfferings.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Courses Assigned", value: myOfferings.length, icon: BookOpen },
            { label: "Total Sections",   value: "-",                icon: CalendarCheck },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold tabular-nums">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && myOfferings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold">No courses assigned</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contact an administrator to get courses assigned to you.
            </p>
          </div>
          <Button onClick={() => router.push("/attendance")} className="gap-2">
            <Scan className="h-4 w-4" />Take Attendance
          </Button>
        </div>
      )}

      {/* Course cards */}
      {!isLoading && myOfferings.length > 0 && (
        <div className="space-y-3">
          {myOfferings.map((offering, i) => (
            <CourseOfferingCard
              key={String(offering.id)}
              offering={offering}
              colorIndex={i}
              isMockMode={isMockMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}
