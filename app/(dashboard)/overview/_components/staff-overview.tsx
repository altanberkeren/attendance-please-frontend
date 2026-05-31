"use client";

import { useQueries } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  Loader2,
  Scan,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  getApiAttendancesMatrix,
  getGetApiAttendancesMatrixQueryKey,
} from "@/lib/api/attendances/attendances";
import { useGetApiCourseOfferings } from "@/lib/api/course-offerings/course-offerings";
import {
  getApiEnrollments,
  getGetApiEnrollmentsQueryKey,
} from "@/lib/api/enrollments/enrollments";
import type { AttendanceMatrixResult, CourseOfferingDto } from "@/lib/api/model";
import { AttendanceStatus } from "@/lib/api/model";
import {
  getApiSessions,
  getGetApiSessionsQueryKey,
} from "@/lib/api/sessions/sessions";
import { cn } from "@/lib/utils";

function barColor(v: number) {
  return v >= 80 ? "bg-primary" : v >= 65 ? "bg-amber-500" : "bg-destructive";
}
function textColor(v: number) {
  return v >= 80
    ? "text-primary"
    : v >= 65
      ? "text-amber-500"
      : "text-destructive";
}
function attendancePct(statuses: string[]) {
  if (statuses.length === 0) return 0;
  const present = statuses.filter(
    (status) =>
      status === AttendanceStatus.Present || status === AttendanceStatus.Late,
  ).length;
  return Math.round((present / statuses.length) * 100);
}
function matrixPct(matrix: AttendanceMatrixResult | undefined) {
  if (!matrix || matrix.students.length === 0 || matrix.modules.length === 0) {
    return 0;
  }
  const statuses = matrix.students.flatMap((student) => student.attendanceStatuses);
  return attendancePct(statuses);
}
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function StaffOverview() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const { data: offerings = [], isLoading: loadingOfferings } =
    useGetApiCourseOfferings(userId ? { staffUserId: userId } : undefined, {
      query: { enabled: !!userId },
    });

  const matrixQueries = useQueries({
    queries: offerings.map((offering) => ({
      queryKey: getGetApiAttendancesMatrixQueryKey({
        courseOfferingId: offering.id,
      }),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getApiAttendancesMatrix({ courseOfferingId: offering.id }, signal),
      enabled: !!userId,
    })),
  });
  const enrollmentQueries = useQueries({
    queries: offerings.map((offering) => ({
      queryKey: getGetApiEnrollmentsQueryKey({ courseOfferingId: offering.id }),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getApiEnrollments({ courseOfferingId: offering.id }, signal),
      enabled: !!userId,
    })),
  });
  const sessionQueries = useQueries({
    queries: offerings.map((offering) => ({
      queryKey: getGetApiSessionsQueryKey({ courseOfferingId: offering.id }),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getApiSessions({ courseOfferingId: offering.id }, signal),
      enabled: !!userId,
    })),
  });

  const matrices = matrixQueries.map((query) => query.data);
  const enrollmentsByCourse = enrollmentQueries.map((query) => query.data ?? []);
  const sessionsByCourse = sessionQueries.map((query) => query.data ?? []);
  const isLoading =
    loadingOfferings ||
    matrixQueries.some((query) => query.isLoading) ||
    enrollmentQueries.some((query) => query.isLoading) ||
    sessionQueries.some((query) => query.isLoading);

  const courseSummaries = offerings.map((offering, index) => {
    const matrix = matrices[index];
    const enrollments = enrollmentsByCourse[index] ?? [];
    return {
      id: offering.id,
      code: offering.courseCode,
      name: offering.courseTitle,
      term: offering.termCode,
      students: enrollments.length || matrix?.students.length || 0,
      attendance: matrixPct(matrix),
    };
  });
  const totalStudents = new Set(
    enrollmentsByCourse.flatMap((enrollments) =>
      enrollments.map((enrollment) => String(enrollment.userId)),
    ),
  ).size;
  const allSessions = sessionsByCourse.flatMap((sessions, courseIndex) =>
    sessions.map((session) => ({
      ...session,
      course: offerings[courseIndex] as CourseOfferingDto | undefined,
    })),
  );
  const today = new Date();
  const todaySessions = allSessions
    .filter((session) => sameDay(new Date(session.openedAt), today))
    .sort(
      (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime(),
    );
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSessions = allSessions.filter(
    (session) => new Date(session.openedAt) >= weekAgo,
  );
  const averageAttendance = courseSummaries.length
    ? Math.round(
        courseSummaries.reduce((sum, course) => sum + course.attendance, 0) /
          courseSummaries.length,
      )
    : 0;
  const atRiskStudents = matrices
    .flatMap((matrix, courseIndex) =>
      (matrix?.students ?? []).map((student) => ({
        name: student.studentName,
        initials: initials(student.studentName),
        course: offerings[courseIndex]?.courseCode ?? "Course",
        attendance: attendancePct(student.attendanceStatuses),
      })),
    )
    .filter((student) => student.attendance < 60)
    .sort((a, b) => a.attendance - b.attendance)
    .slice(0, 6);

  const stats = [
    {
      label: "My Students",
      value: String(totalStudents),
      change: `across ${offerings.length} course${offerings.length !== 1 ? "s" : ""}`,
      up: true,
      icon: Users,
    },
    {
      label: "This Week",
      value: String(weekSessions.length),
      change: "sessions held",
      up: true,
      icon: CalendarCheck,
    },
    {
      label: "Avg Attendance",
      value: `${averageAttendance}%`,
      change: "current courses",
      up: averageAttendance >= 70,
      icon: BarChart3,
    },
    {
      label: "At Risk",
      value: String(atRiskStudents.length),
      change: "below 60% threshold",
      up: atRiskStudents.length === 0,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good morning 👋
          </h1>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/attendance")}
          className={cn(
            "group flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-3",
            "hover:border-primary/60 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/10 active:scale-[0.98]",
            "transition-all duration-150 self-start sm:self-auto",
          )}
        >
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/40">
            <Scan className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold leading-tight">AttendancePlease</p>
            <p className="text-[11px] text-muted-foreground">
              Start taking attendance
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-1 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && offerings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No courses assigned yet.
          </CardContent>
        </Card>
      )}

      {!isLoading && offerings.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {stat.label}
                    </span>
                    <stat.icon
                      className={cn(
                        "h-4 w-4",
                        stat.up ? "text-primary" : "text-destructive",
                      )}
                    />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-1 text-xs",
                      stat.up ? "text-primary" : "text-destructive",
                    )}
                  >
                    {stat.up ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {stat.change}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    Today&apos;s Schedule
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {todaySessions.length} sessions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {todaySessions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No sessions scheduled today.
                  </p>
                ) : (
                  todaySessions.map((session) => {
                    const sessionEnrollments = session.sectionId
                      ? enrollmentsByCourse[
                          offerings.findIndex(
                            (offering) => offering.id === session.course?.id,
                          )
                        ]?.filter(
                          (enrollment) =>
                            String(enrollment.sectionId) ===
                            String(session.sectionId),
                        )
                      : enrollmentsByCourse[
                          offerings.findIndex(
                            (offering) => offering.id === session.course?.id,
                          )
                        ];
                    return (
                      <button
                        type="button"
                        key={String(session.id)}
                        onClick={() =>
                          router.push(
                            `/sessions/detail?id=${encodeURIComponent(String(session.id))}${session.course?.id ? `&courseOfferingId=${encodeURIComponent(String(session.course.id))}` : ""}`,
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                      >
                        <div className="text-[11px] font-mono text-muted-foreground w-20 shrink-0 text-center whitespace-pre-line leading-tight">
                          {formatTime(session.openedAt)}
                        </div>
                        <div className="w-0.5 self-stretch rounded-full shrink-0 bg-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono font-bold text-sm">
                              {session.course?.courseCode ?? "Course"}
                            </span>
                            {session.sectionName && (
                              <span className="text-xs text-muted-foreground">
                                {session.sectionName}
                              </span>
                            )}
                            <Badge className="ml-auto border-0 bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.moduleTitle}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">
                            {sessionEnrollments?.length ?? 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            students
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-sm font-medium">
                    At-Risk Students
                  </CardTitle>
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {atRiskStudents.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {atRiskStudents.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No students below the threshold.
                  </p>
                ) : (
                  atRiskStudents.map((student) => (
                    <div
                      key={`${student.course}-${student.name}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-destructive/20 text-destructive font-semibold">
                          {student.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.course}
                        </p>
                      </div>
                      <Badge variant="destructive" className="shrink-0 tabular-nums">
                        {student.attendance}%
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Attendance Rate by Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {courseSummaries.map((course) => (
                  <div key={String(course.id)} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm">
                          {course.code}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {course.name}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          textColor(course.attendance),
                        )}
                      >
                        {course.attendance}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", barColor(course.attendance))}
                        style={{ width: `${course.attendance}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {course.students} students · {course.term}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
