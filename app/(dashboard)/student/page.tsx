"use client"

import { useState } from "react"
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useGetApiEnrollments } from "@/lib/api/enrollments/enrollments"
import { useGetApiAttendancesOverview } from "@/lib/api/attendances/attendances"
import type { ModuleAttendanceSummary } from "@/lib/api/model"

// ── Status helpers ─────────────────────────────────────────────────────────────

type StatusKey = "Present" | "Late" | "Absent" | "Excused" | null

function statusBadge(status: string | null) {
  switch (status) {
    case "Present":
      return (
        <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Present
        </Badge>
      )
    case "Late":
      return (
        <Badge className="bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Late
        </Badge>
      )
    case "Absent":
      return (
        <Badge className="bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/20">
          <XCircle className="h-3 w-3 mr-1" />
          Absent
        </Badge>
      )
    case "Excused":
      return (
        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
          <FileCheck className="h-3 w-3 mr-1" />
          Excused
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          —
        </Badge>
      )
  }
}

function attendanceColor(rate: number) {
  if (rate >= 80) return "bg-green-500"
  if (rate >= 65) return "bg-yellow-500"
  return "bg-destructive"
}

function attendanceTextColor(rate: number) {
  if (rate >= 80) return "text-green-600 dark:text-green-400"
  if (rate >= 65) return "text-yellow-600 dark:text-yellow-400"
  return "text-destructive"
}

// ── Attendance overview for a single course offering ──────────────────────────

function CourseAttendance({ courseOfferingId }: { courseOfferingId: number | string }) {
  const { data, isLoading, isError } = useGetApiAttendancesOverview(
    { courseOfferingId },
    { query: { enabled: !!courseOfferingId } }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading attendance…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm">Failed to load attendance data.</span>
      </div>
    )
  }

  const total = Number(data.totalModules) || 0
  const present = Number(data.presentCount) || 0
  const late = Number(data.lateCount) || 0
  const absent = Number(data.absentCount) || 0
  const excused = Number(data.excusedCount) || 0
  const attended = present + late
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0

  const stats = [
    { label: "Present", value: present, icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
    { label: "Late", value: late, icon: Clock, color: "text-yellow-600 dark:text-yellow-400" },
    { label: "Absent", value: absent, icon: XCircle, color: "text-destructive" },
    { label: "Excused", value: excused, icon: FileCheck, color: "text-blue-600 dark:text-blue-400" },
  ]

  const sortedModules = [...(data.modules ?? [])].sort(
    (a, b) => Number(a.orderIndex) - Number(b.orderIndex)
  )

  return (
    <div className="space-y-6">
      {/* Attendance rate card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Overall Attendance Rate</p>
              <p className={`text-3xl font-bold tracking-tight mt-0.5 ${attendanceTextColor(attendanceRate)}`}>
                {attendanceRate}%
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">{attended}</span> attended
              </p>
              <p>
                out of <span className="font-semibold text-foreground">{total}</span> modules
              </p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${attendanceColor(attendanceRate)}`}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
              <span className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</span>
              {total > 0 && (
                <span className="text-xs text-muted-foreground">
                  {Math.round((s.value / total) * 100)}% of modules
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Module Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedModules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No modules recorded yet.</p>
          ) : (
            <div className="divide-y">
              {sortedModules.map((mod: ModuleAttendanceSummary) => (
                <div
                  key={String(mod.moduleId)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{mod.moduleTitle}</p>
                    {mod.sectionName && (
                      <p className="text-xs text-muted-foreground">{mod.sectionName}</p>
                    )}
                  </div>
                  <div className="shrink-0 ml-4">
                    {statusBadge(mod.attendanceStatus)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentPage() {
  const { data: enrollments, isLoading, isError } = useGetApiEnrollments({})
  const [selectedTab, setSelectedTab] = useState<string | undefined>(undefined)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading your courses…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm">Failed to load enrollments.</span>
      </div>
    )
  }

  const list = enrollments ?? []

  if (list.length === 0) {
    return (
      <div className="space-y-6 max-w-screen-xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Attendance</h1>
          <p className="text-sm text-muted-foreground">Track your attendance across enrolled courses</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <BookOpen className="h-8 w-8" />
            <p className="text-sm">You are not enrolled in any courses yet.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeTab = selectedTab ?? String(list[0].courseOfferingId)

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Attendance</h1>
        <p className="text-sm text-muted-foreground">Track your attendance across enrolled courses</p>
      </div>

      {list.length === 1 ? (
        <CourseAttendance courseOfferingId={list[0].courseOfferingId} />
      ) : (
        <Tabs value={activeTab} onValueChange={setSelectedTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            {list.map((enrollment) => (
              <TabsTrigger
                key={String(enrollment.courseOfferingId)}
                value={String(enrollment.courseOfferingId)}
                className="text-xs"
              >
                {enrollment.sectionName}
              </TabsTrigger>
            ))}
          </TabsList>

          {list.map((enrollment) => (
            <TabsContent
              key={String(enrollment.courseOfferingId)}
              value={String(enrollment.courseOfferingId)}
              className="mt-4"
            >
              <CourseAttendance courseOfferingId={enrollment.courseOfferingId} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
