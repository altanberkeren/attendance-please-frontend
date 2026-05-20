"use client"

import { useState } from "react"
import {
  BookOpen, CalendarDays, CheckCircle2, XCircle,
  ChevronRight, LayoutList,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { cn } from "@/lib/utils"
import {
  useGetApiCourseOfferings,
} from "@/lib/api/course-offerings/course-offerings"
import { useQueries, useQueryClient } from "@tanstack/react-query"
import type { CourseOfferingDto } from "@/lib/api/model"
import type { StudentAttendanceOverview } from "@/lib/api/model"

const FAIL_THRESHOLD = 75

interface ClassData {
  id: string
  courseCode: string
  courseName: string
  termCode: string
  sectionName: string
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  totalModules: number
  modules: {
    id: number
    title: string
    orderIndex: number
    status: string | null
    sectionName: string | null
  }[]
}

function toClassData(offering: CourseOfferingDto, overview: StudentAttendanceOverview): ClassData {
  return {
    id: String(offering.id),
    courseCode: offering.courseCode,
    courseName: offering.courseTitle,
    termCode: offering.termCode,
    sectionName: "",
    presentCount: Number(overview.presentCount),
    lateCount: Number(overview.lateCount),
    absentCount: Number(overview.absentCount),
    excusedCount: Number(overview.excusedCount),
    totalModules: Number(overview.totalModules),
    modules: overview.modules.map((m) => ({
      id: Number(m.moduleId),
      title: m.moduleTitle,
      orderIndex: Number(m.orderIndex),
      status: m.attendanceStatus,
      sectionName: m.sectionName,
    })),
  }
}

function calcRate(d: ClassData) {
  const total = d.presentCount + d.lateCount + d.absentCount + d.excusedCount
  if (total === 0) return 0
  return Math.round(((d.presentCount + d.lateCount) / total) * 100)
}

function calcDaysRemaining(d: ClassData): number {
  return Math.max(0, d.totalModules - (d.absentCount + d.lateCount))
}

function ClassStatusBadge({ rate }: { rate: number }) {
  const passed = rate >= FAIL_THRESHOLD
  return (
    <Badge className={cn(passed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
      {passed ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
      {passed ? "Pass" : "Fail"}
    </Badge>
  )
}

function AttendancePie({ d }: { d: ClassData }) {
  const data = [
    { name: "Present", value: d.presentCount, color: "#0284c7" },
    { name: "Late", value: d.lateCount, color: "#eab308" },
    { name: "Absent", value: d.absentCount, color: "#ef4444" },
    { name: "Excused", value: d.excusedCount, color: "#8b5cf6" },
  ].filter((e) => e.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No attendance data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <RechartsPie>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={72}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [value, ""]}
        />
        <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
      </RechartsPie>
    </ResponsiveContainer>
  )
}

function AttendanceCalendar({ d }: { d: ClassData }) {
  const now = new Date()
  const weeksBack = Math.min(d.totalModules, 12)
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - weeksBack * 7)

  const days: { date: Date; module: ClassData["modules"][0] | null; status: string | null }[] = []
  for (let i = 0; i < weeksBack * 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const weekday = date.getDay()
    if (weekday === 0 || weekday === 6) continue

    const moduleIndex = d.modules.findIndex((m) => m.orderIndex === i + 1)
    days.push({
      date,
      module: moduleIndex >= 0 ? d.modules[moduleIndex] : null,
      status: moduleIndex >= 0 ? d.modules[moduleIndex].status : null,
    })
  }

  function statusColor(status: string | null) {
    switch (status) {
      case "Present": return "bg-primary"
      case "Late": return "bg-yellow-500"
      case "Absent": return "bg-red-500"
      case "Excused": return "bg-violet-500"
      default: return "bg-muted"
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Present</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Late</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Absent</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" /> Excused</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted border" /> No class</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1.5">
            {days.slice(0, d.totalModules > 0 ? d.totalModules : 30).map((day, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg p-2 text-center transition-colors",
                  day.status === "Absent" ? "bg-red-500/10 border border-red-500/20" :
                  day.status === "Late" ? "bg-yellow-500/10 border border-yellow-500/20" :
                  day.status === "Excused" ? "bg-violet-500/10 border border-violet-500/20" :
                  day.status === "Present" ? "bg-primary/10 border border-primary/20" :
                  "bg-muted/50 border border-border"
                )}
              >
                <span className="text-[10px] text-muted-foreground">
                  {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <div className={cn("mt-1 h-3 w-3 rounded-full", statusColor(day.status))} />
                <span className="mt-1 text-[9px] text-muted-foreground truncate w-full">{day.module?.title ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ModuleBreakdown({ d }: { d: ClassData }) {
  function statusLabel(status: string | null) {
    if (!status) return "No class"
    return status
  }

  return (
    <div className="space-y-2">
      {d.modules.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No module data available</p>
      )}
      {d.modules.map((mod) => (
        <div
          key={mod.id}
          className={cn(
            "flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors",
            mod.status === "Absent" ? "bg-red-500/5 border-red-500/15" :
            mod.status === "Late" ? "bg-yellow-500/5 border-yellow-500/15" :
            mod.status === "Excused" ? "bg-violet-500/5 border-violet-500/15" :
            mod.status === "Present" ? "bg-primary/5 border-primary/15" :
            "bg-muted/50 border-border"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-muted-foreground font-mono w-6 shrink-0">#{mod.orderIndex}</span>
            <span className="text-sm font-medium truncate">{mod.title}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {mod.sectionName && (
              <span className="text-xs text-muted-foreground">{mod.sectionName}</span>
            )}
            <Badge
              className={cn(
                "text-xs",
                mod.status === "Present" ? "bg-primary/10 text-primary dark:text-primary border-primary/20" :
                mod.status === "Late" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" :
                mod.status === "Absent" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" :
                mod.status === "Excused" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" :
                "bg-muted text-muted-foreground border-transparent"
              )}
            >
              {statusLabel(mod.status)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClassCard({ data, onClick }: { data: ClassData; onClick: () => void }) {
  const rate = calcRate(data)
  const days = calcDaysRemaining(data)

  return (
    <Card
      className="group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-primary/10 text-primary">
              {data.courseCode}
            </span>
            <ClassStatusBadge rate={rate} />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardTitle className="text-base leading-snug mt-2">{data.courseName}</CardTitle>
        <p className="text-xs text-muted-foreground">{data.termCode}</p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[160px] mb-3">
          <AttendancePie d={data} />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{rate}%</div>
            <div className="text-[10px] text-muted-foreground">Attendance</div>
          </div>
          <div className="text-center">
            <div className={cn("text-lg font-bold tabular-nums", days <= 2 ? "text-destructive" : "text-primary")}>
              {days}
            </div>
            <div className="text-[10px] text-muted-foreground">Days left</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{data.totalModules}</div>
            <div className="text-[10px] text-muted-foreground">Sessions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ClassDetail({ data, onClose }: { data: ClassData; onClose: () => void }) {
  const rate = calcRate(data)
  const days = calcDaysRemaining(data)
  const total = data.presentCount + data.lateCount + data.absentCount + data.excusedCount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{data.courseName}</h2>
            <ClassStatusBadge rate={rate} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.courseCode} · {data.termCode}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[180px]">
              <AttendancePie d={data} />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">Present</span>
                <span className="ml-auto text-sm font-semibold">{data.presentCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-sm">Late</span>
                <span className="ml-auto text-sm font-semibold">{data.lateCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm">Absent</span>
                <span className="ml-auto text-sm font-semibold">{data.absentCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-sm">Excused</span>
                <span className="ml-auto text-sm font-semibold">{data.excusedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="flex flex-col items-center justify-center py-4">
              <div className={cn("text-5xl font-bold tabular-nums", rate >= FAIL_THRESHOLD ? "text-emerald-500" : "text-destructive")}>
                {rate}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Attendance Rate</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                <span className={cn("text-2xl font-bold", days <= 2 ? "text-destructive" : "text-primary")}>{days}</span>
                <span className="text-xs text-muted-foreground mt-1">Days you can miss</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                <span className="text-2xl font-bold text-primary">{total}</span>
                <span className="text-xs text-muted-foreground mt-1">Total sessions</span>
              </div>
            </div>
            {days <= 2 && days > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-xs">Only {days} miss{ days === 1 ? "" : "es" } remaining. Be careful!</span>
              </div>
            )}
            {days <= 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="text-xs">No absences remaining. Every absence now counts!</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Modules attended</span>
              <span className="text-sm font-semibold">{data.presentCount + data.lateCount}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Unexcused absences</span>
              <span className="text-sm font-semibold">{data.absentCount}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Excused absences</span>
              <span className="text-sm font-semibold">{data.excusedCount}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Pass threshold</span>
              <span className="text-sm font-semibold">{FAIL_THRESHOLD}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-1.5">
            <LayoutList className="h-3.5 w-3.5" />
            Modules
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <AttendanceCalendar d={data} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="modules" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <ModuleBreakdown d={data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function buildEmptyOverview(): StudentAttendanceOverview {
  return {
    totalModules: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
    modules: [],
  }
}

function loadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-6 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[160px] bg-muted rounded" />
            <div className="grid grid-cols-3 gap-2 pt-3 border-t mt-3">
              <div className="h-8 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MyClassesPage() {
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const queryClient = useQueryClient()

  const offeringsQuery = useGetApiCourseOfferings({})

  const overviewQueries = useQueries({
    queries: (offeringsQuery.data ?? []).map((offering) => ({
      queryKey: ["attendances-overview", offering.id],
      queryFn: async () => {
        try {
          const { getApiAttendancesOverview } = await import("@/lib/api/attendances/attendances")
          return await getApiAttendancesOverview({ courseOfferingId: offering.id })
        } catch {
          return buildEmptyOverview()
        }
      },
      enabled: !!offeringsQuery.data,
      retry: false,
    })),
  })

  const isLoading = offeringsQuery.isPending || overviewQueries.some((q) => q.isLoading)

  const classes: ClassData[] = (() => {
    if (!offeringsQuery.data) return []
    return offeringsQuery.data
      .map((offering, index) => {
        const overview = overviewQueries[index]?.data
        if (!overview) return null
        return toClassData(offering, overview)
      })
      .filter((c): c is ClassData => c !== null && c.totalModules > 0)
  })()

  const failing = classes.filter((d) => calcRate(d) < FAIL_THRESHOLD)

  if (selectedClass) {
    return (
      <div className="max-w-screen-xl">
        <ClassDetail data={selectedClass} onClose={() => setSelectedClass(null)} />
      </div>
    )
  }

  if (offeringsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium">Failed to load courses</p>
        <p className="text-xs text-muted-foreground mt-1">Please check your connection and try again.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["getApiCourseOfferings"] })}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Classes</h1>
          <p className="text-sm text-muted-foreground">
            {classes.length} enrolled course{classes.length !== 1 ? "s" : ""}
            {failing.length > 0 && (
              <span className="ml-2 text-destructive">
                · {failing.length} at risk
              </span>
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        loadingSkeleton()
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No classes found</p>
          <p className="text-xs text-muted-foreground mt-1">You are not enrolled in any courses, or no attendance has been recorded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <ClassCard key={c.id} data={c} onClick={() => setSelectedClass(c)} />
          ))}
        </div>
      )}
    </div>
  )
}