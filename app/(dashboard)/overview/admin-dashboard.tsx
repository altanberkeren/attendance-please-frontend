"use client";

import { useQueries } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Clock,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getApiAttendancesMatrix,
  getApiAttendancesSessionSessionId,
  getGetApiAttendancesMatrixQueryKey,
  getGetApiAttendancesSessionSessionIdQueryKey,
} from "@/lib/api/attendances/attendances";
import { useGetApiCourseOfferings } from "@/lib/api/course-offerings/course-offerings";
import {
  getApiEnrollments,
  getGetApiEnrollmentsQueryKey,
} from "@/lib/api/enrollments/enrollments";
import type { AttendanceMatrixResult } from "@/lib/api/model";
import { AttendanceStatus, SessionStatus, UserRole } from "@/lib/api/model";
import { useGetApiModules } from "@/lib/api/modules/modules";
import { useGetApiSessions } from "@/lib/api/sessions/sessions";
import { useGetApiUsers } from "@/lib/api/users/users";

function barColor(v: number) {
  if (v >= 80) return "bg-primary";
  if (v >= 65) return "bg-secondary";
  return "bg-destructive";
}
function textColor(v: number) {
  if (v >= 80) return "text-primary";
  if (v >= 65) return "text-secondary";
  return "text-destructive";
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
  return attendancePct(
    matrix.students.flatMap((student) => student.attendanceStatuses),
  );
}
function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}
function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day ago`;
}

export default function OverviewPage() {
  const { data: users = [], isLoading: loadingUsers } = useGetApiUsers();
  const { data: offerings = [], isLoading: loadingOfferings } =
    useGetApiCourseOfferings();
  const { data: sessions = [], isLoading: loadingSessions } = useGetApiSessions();
  const { data: modules = [], isLoading: loadingModules } = useGetApiModules();

  const matrixQueries = useQueries({
    queries: offerings.map((offering) => ({
      queryKey: getGetApiAttendancesMatrixQueryKey({
        courseOfferingId: offering.id,
      }),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getApiAttendancesMatrix({ courseOfferingId: offering.id }, signal),
    })),
  });
  const enrollmentQueries = useQueries({
    queries: offerings.map((offering) => ({
      queryKey: getGetApiEnrollmentsQueryKey({ courseOfferingId: offering.id }),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getApiEnrollments({ courseOfferingId: offering.id }, signal),
    })),
  });

  const activeSessions = sessions.filter(
    (session) => session.status === SessionStatus.Open,
  );
  const activeAttendanceQueries = useQueries({
    queries: activeSessions.map((session) => ({
      queryKey: getGetApiAttendancesSessionSessionIdQueryKey(session.id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getApiAttendancesSessionSessionId(session.id, signal),
      refetchInterval: 3000,
    })),
  });

  const matrices = matrixQueries.map((query) => query.data);
  const enrollmentsByCourse = enrollmentQueries.map((query) => query.data ?? []);
  const isLoading =
    loadingUsers ||
    loadingOfferings ||
    loadingSessions ||
    loadingModules ||
    matrixQueries.some((query) => query.isLoading) ||
    enrollmentQueries.some((query) => query.isLoading) ||
    activeAttendanceQueries.some((query) => query.isLoading);

  const students = users.filter(
    (user) => user.role === UserRole.Student || user.roles.includes(UserRole.Student),
  );
  const courseBars = offerings
    .map((offering, index) => ({
      code: offering.courseCode,
      name: offering.courseTitle,
      value: matrixPct(matrices[index]),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const avgAttendance = courseBars.length
    ? Math.round(
        courseBars.reduce((sum, course) => sum + course.value, 0) /
          courseBars.length,
      )
    : 0;
  const atRisk = matrices
    .flatMap((matrix, index) =>
      (matrix?.students ?? []).map((student) => ({
        name: student.studentName,
        initials: initials(student.studentName),
        course: offerings[index]?.courseCode ?? "Course",
        attendance: attendancePct(student.attendanceStatuses),
      })),
    )
    .filter((student) => student.attendance < 60)
    .sort((a, b) => a.attendance - b.attendance)
    .slice(0, 5);
  const moduleById = new Map(modules.map((module) => [String(module.id), module]));

  const stats = [
    {
      label: "Total Students",
      value: String(students.length),
      change: "registered users",
      up: true,
      icon: Users,
    },
    {
      label: "Active Sessions",
      value: String(activeSessions.length),
      change: "Live right now",
      up: activeSessions.length > 0,
      icon: Activity,
    },
    {
      label: "Avg Attendance",
      value: `${avgAttendance}%`,
      change: "across offerings",
      up: avgAttendance >= 70,
      icon: BarChart3,
    },
    {
      label: "Total Courses",
      value: String(offerings.length),
      change: "course offerings",
      up: true,
      icon: BookOpen,
    },
  ];
  const recentActivity = sessions
    .slice()
    .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())
    .slice(0, 6)
    .map((session) => ({
      msg: `${session.status === SessionStatus.Open ? "Session opened" : "Session closed"}: ${session.moduleTitle}${session.sectionName ? ` / ${session.sectionName}` : ""}`,
      time: timeAgo(session.closedAt ?? session.openedAt),
    }));

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Live system snapshot</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {stat.label}
                    </span>
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-primary">
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
                <CardTitle className="text-sm font-medium">
                  Attendance Rate by Course
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {courseBars.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No attendance data yet.
                  </p>
                ) : (
                  courseBars.map((item) => (
                    <div key={item.code} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>
                          <span className="font-mono font-semibold">{item.code}</span>
                          <span className="text-muted-foreground ml-2">
                            {item.name}
                          </span>
                        </span>
                        <span className={`font-bold ${textColor(item.value)}`}>
                          {item.value}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor(item.value)}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Active Sessions
                  </CardTitle>
                  <Badge className="animate-pulse text-xs">
                    {activeSessions.length} Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeSessions.map((session, index) => {
                  const moduleData = moduleById.get(String(session.moduleId));
                  const offeringIndex = offerings.findIndex(
                    (offering) =>
                      String(offering.id) === String(moduleData?.courseOfferingId),
                  );
                  const total = session.sectionId
                    ? (enrollmentsByCourse[offeringIndex] ?? []).filter(
                        (enrollment) =>
                          String(enrollment.sectionId) === String(session.sectionId),
                      ).length
                    : (enrollmentsByCourse[offeringIndex] ?? []).length;
                  const present = (activeAttendanceQueries[index]?.data ?? []).filter(
                    (attendance) =>
                      attendance.status === AttendanceStatus.Present ||
                      attendance.status === AttendanceStatus.Late,
                  ).length;
                  return (
                    <div key={String(session.id)} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="font-mono font-semibold text-sm">
                              {offerings[offeringIndex]?.courseCode ?? "Course"}
                            </span>
                            {session.sectionName && (
                              <span className="text-xs text-muted-foreground">
                                {session.sectionName}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 pl-4">
                            {session.moduleTitle}
                          </p>
                        </div>
                        <span className="text-xs font-semibold shrink-0">
                          {present}/{total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${total ? (present / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {activeSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active sessions
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {recentActivity.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No recent sessions.
                  </p>
                ) : (
                  recentActivity.map((item) => (
                    <div
                      key={`${item.msg}-${item.time}`}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="flex-1 text-sm">{item.msg}</span>
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </span>
                    </div>
                  ))
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
                    {atRisk.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {atRisk.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No students below the threshold.
                  </p>
                ) : (
                  atRisk.map((student) => (
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
                        <p className="text-sm font-medium truncate">{student.name}</p>
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
        </>
      )}
    </div>
  );
}
