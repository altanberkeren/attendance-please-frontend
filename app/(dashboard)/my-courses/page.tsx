"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  LayoutList,
  XCircle,
} from "lucide-react"
import { useQueries, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { getApiAttendancesOverview } from "@/lib/api/attendances/attendances"
import { useGetApiCourseOfferings } from "@/lib/api/course-offerings/course-offerings"
import { useGetApiEnrollments } from "@/lib/api/enrollments/enrollments"
import type { CourseOfferingDto, StudentAttendanceOverview } from "@/lib/api/model"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const FAIL_THRESHOLD = 75

type AttendanceStatus = "Present" | "Late" | "Absent" | "Excused" | null

type ClassData = {
  id: string
  courseCode: string
  courseName: string
  termCode: string
  sectionName: string | null
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  totalModules: number
  modules: {
    id: number
    title: string
    orderIndex: number
    status: AttendanceStatus
    sectionName: string | null
  }[]
}

function emptyOverview(): StudentAttendanceOverview {
  return {
    totalModules: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
    modules: [],
  }
}

function toNumber(value: number | string | undefined | null): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function asAttendanceStatus(value: string | null): AttendanceStatus {
  if (value === "Present" || value === "Late" || value === "Absent" || value === "Excused") return value
  return null
}

function toClassData(
  offering: CourseOfferingDto | undefined,
  overview: StudentAttendanceOverview,
  fallbackOfferingId: number | string,
  sectionName: string | null,
): ClassData {
  return {
    id: String(offering?.id ?? fallbackOfferingId),
    courseCode: offering?.courseCode ?? `#${fallbackOfferingId}`,
    courseName: offering?.courseTitle ?? "Course offering",
    termCode: offering?.termCode ?? "Current term",
    sectionName,
    presentCount: toNumber(overview.presentCount),
    lateCount: toNumber(overview.lateCount),
    absentCount: toNumber(overview.absentCount),
    excusedCount: toNumber(overview.excusedCount),
    totalModules: toNumber(overview.totalModules),
    modules: overview.modules.map((module) => ({
      id: toNumber(module.moduleId),
      title: module.moduleTitle,
      orderIndex: toNumber(module.orderIndex),
      status: asAttendanceStatus(module.attendanceStatus),
      sectionName: module.sectionName,
    })),
  }
}

function calcRate(data: ClassData): number {
  const total = data.presentCount + data.lateCount + data.absentCount + data.excusedCount
  if (total === 0) return 0
  return Math.round(((data.presentCount + data.lateCount + data.excusedCount) / total) * 100)
}

function calcAbsencesRemaining(data: ClassData): number {
  if (data.totalModules <= 0) return 0
  const maxMisses = Math.floor(data.totalModules * ((100 - FAIL_THRESHOLD) / 100))
  return Math.max(0, maxMisses - data.absentCount)
}

function statusStyles(status: AttendanceStatus): string {
  switch (status) {
    case "Present":
      return "bg-primary/10 text-primary border-primary/20"
    case "Late":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
    case "Absent":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "Excused":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20"
    default:
      return "bg-muted text-muted-foreground border-transparent"
  }
}

function ClassStatusBadge({ rate }: { rate: number }) {
  const passing = rate >= FAIL_THRESHOLD
  return (
    <Badge
      variant="outline"
      className={cn(
        passing
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          : "bg-destructive/10 text-destructive border-destructive/20",
      )}
    >
      {passing ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
      {passing ? "Passing" : "At risk"}
    </Badge>
  )
}

function AttendanceDonut({ data }: { data: ClassData }) {
  const total = data.presentCount + data.lateCount + data.absentCount + data.excusedCount

  if (total === 0) {
    return (
      <div className="flex h-full min-h-[150px] items-center justify-center rounded-full border border-dashed text-sm text-muted-foreground">
        No data
      </div>
    )
  }

  const present = (data.presentCount / total) * 100
  const late = present + (data.lateCount / total) * 100
  const absent = late + (data.absentCount / total) * 100

  return (
    <div className="flex h-full min-h-[150px] items-center justify-center">
      <div
        className="relative h-32 w-32 rounded-full"
        style={{
          background: `conic-gradient(var(--primary) 0 ${present}%, #eab308 ${present}% ${late}%, #ef4444 ${late}% ${absent}%, #8b5cf6 ${absent}% 100%)`,
        }}
      >
        <div className="absolute inset-4 grid place-items-center rounded-full bg-card text-center">
          <div>
            <div className="text-2xl font-bold tabular-nums">{calcRate(data)}%</div>
            <div className="text-[10px] text-muted-foreground">attendance</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Present</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Late</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Absent</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" /> Excused</span>
    </div>
  )
}

function ModuleBreakdown({ data }: { data: ClassData }) {
  if (data.modules.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No module data available yet.</p>
  }

  return (
    <div className="space-y-2">
      {data.modules.map((module) => (
        <div
          key={`${module.id}-${module.orderIndex}`}
          className={cn("flex items-center justify-between rounded-lg border px-3 py-2.5", statusStyles(module.status))}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-7 shrink-0 font-mono text-xs text-muted-foreground">#{module.orderIndex}</span>
            <span className="truncate text-sm font-medium">{module.title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {module.sectionName ? <span className="text-xs text-muted-foreground">{module.sectionName}</span> : null}
            <Badge variant="outline" className={cn("text-xs", statusStyles(module.status))}>
              {module.status ?? "No mark"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClassCard({ data, onClick }: { data: ClassData; onClick: () => void }) {
  const rate = calcRate(data)
  const remaining = calcAbsencesRemaining(data)

  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
              {data.courseCode}
            </span>
            <ClassStatusBadge rate={rate} />
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <CardTitle className="mt-2 text-base leading-snug">{data.courseName}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {data.termCode}{data.sectionName ? ` · ${data.sectionName}` : ""}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3 h-[150px]">
          <AttendanceDonut data={data} />
        </div>
        <div className="grid grid-cols-3 gap-2 border-t pt-3">
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{rate}%</div>
            <div className="text-[10px] text-muted-foreground">Attendance</div>
          </div>
          <div className="text-center">
            <div className={cn("text-lg font-bold tabular-nums", remaining <= 1 ? "text-destructive" : "text-primary")}>
              {remaining}
            </div>
            <div className="text-[10px] text-muted-foreground">Absences left</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{data.totalModules}</div>
            <div className="text-[10px] text-muted-foreground">Modules</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ClassDetail({ data, onClose }: { data: ClassData; onClose: () => void }) {
  const rate = calcRate(data)
  const remaining = calcAbsencesRemaining(data)
  const totalMarked = data.presentCount + data.lateCount + data.absentCount + data.excusedCount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{data.courseName}</h2>
            <ClassStatusBadge rate={rate} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.courseCode} · {data.termCode}{data.sectionName ? ` · ${data.sectionName}` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[180px]">
              <AttendanceDonut data={data} />
            </div>
            <Legend />
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
              <div className="mt-1 text-sm text-muted-foreground">Attendance Rate</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
                <span className={cn("text-2xl font-bold", remaining <= 1 ? "text-destructive" : "text-primary")}>{remaining}</span>
                <span className="mt-1 text-xs text-muted-foreground">Absences left</span>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
                <span className="text-2xl font-bold text-primary">{totalMarked}</span>
                <span className="mt-1 text-xs text-muted-foreground">Marked modules</span>
              </div>
            </div>
            {remaining <= 1 && data.totalModules > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-xs">Attendance is close to the {FAIL_THRESHOLD}% threshold.</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <StatRow label="Present" value={data.presentCount} />
            <StatRow label="Late" value={data.lateCount} />
            <StatRow label="Absent" value={data.absentCount} />
            <StatRow label="Excused" value={data.excusedCount} />
            <StatRow label="Pass threshold" value={`${FAIL_THRESHOLD}%`} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList>
          <TabsTrigger value="modules" className="gap-1.5">
            <LayoutList className="h-3.5 w-3.5" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Summary
          </TabsTrigger>
        </TabsList>
        <TabsContent value="modules" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <ModuleBreakdown data={data} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardContent className="space-y-3 pt-4 text-sm text-muted-foreground">
              <p>This view uses your enrolled course offerings and attendance overview from the backend.</p>
              <p>Detailed calendar/date support can be added once session dates are exposed for students.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {["one", "two", "three", "four", "five", "six"].map((key) => (
        <Card key={key} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="mb-2 h-6 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[150px] rounded bg-muted" />
            <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
              <div className="h-8 rounded bg-muted" />
              <div className="h-8 rounded bg-muted" />
              <div className="h-8 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MyCoursesPage() {
  const { user } = useAuth()
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const queryClient = useQueryClient()

  const enrollmentsQuery = useGetApiEnrollments(
    user?.id ? { userId: user.id } : undefined,
    { query: { enabled: !!user?.id } },
  )
  const offeringsQuery = useGetApiCourseOfferings()

  const offeringById = useMemo(() => {
    const map = new Map<string, CourseOfferingDto>()
    for (const offering of offeringsQuery.data ?? []) {
      map.set(String(offering.id), offering)
    }
    return map
  }, [offeringsQuery.data])

  const overviewQueries = useQueries({
    queries: (enrollmentsQuery.data ?? []).map((enrollment) => ({
      queryKey: ["student-attendance-overview", enrollment.courseOfferingId],
      queryFn: async () => getApiAttendancesOverview({ courseOfferingId: enrollment.courseOfferingId }).catch(() => emptyOverview()),
      enabled: !!user?.id,
      retry: false,
    })),
  })

  const classes = useMemo<ClassData[]>(() => {
    return (enrollmentsQuery.data ?? [])
      .map((enrollment, index) => {
        const overview = overviewQueries[index]?.data
        if (!overview) return null
        return toClassData(
          offeringById.get(String(enrollment.courseOfferingId)),
          overview,
          enrollment.courseOfferingId,
          enrollment.sectionName,
        )
      })
      .filter((course): course is ClassData => course !== null)
  }, [enrollmentsQuery.data, offeringById, overviewQueries])

  const isLoading = enrollmentsQuery.isPending || offeringsQuery.isPending || overviewQueries.some((query) => query.isLoading)
  const failing = classes.filter((course) => calcRate(course) < FAIL_THRESHOLD && course.totalModules > 0)

  if (selectedClass) {
    return (
      <div className="max-w-screen-xl">
        <ClassDetail data={selectedClass} onClose={() => setSelectedClass(null)} />
      </div>
    )
  }

  if (enrollmentsQuery.isError || offeringsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium">Failed to load courses</p>
        <p className="mt-1 text-xs text-muted-foreground">Please check your connection and try again.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/Enrollments"] })
            queryClient.invalidateQueries({ queryKey: ["/api/CourseOfferings"] })
          }}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            {classes.length} enrolled course{classes.length !== 1 ? "s" : ""}
            {failing.length > 0 ? <span className="ml-2 text-destructive">· {failing.length} at risk</span> : null}
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No courses found</p>
          <p className="mt-1 text-xs text-muted-foreground">You are not enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((course) => (
            <ClassCard key={course.id} data={course} onClick={() => setSelectedClass(course)} />
          ))}
        </div>
      )}
    </div>
  )
}
