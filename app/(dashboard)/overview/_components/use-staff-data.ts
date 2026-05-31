"use client";

import { useQueries } from "@tanstack/react-query";
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

// ── Helpers ──────────────────────────────────────────────────────────────────

export function attendancePct(statuses: string[]) {
  if (statuses.length === 0) return 0;
  const present = statuses.filter(
    (s) => s === AttendanceStatus.Present || s === AttendanceStatus.Late,
  ).length;
  return Math.round((present / statuses.length) * 100);
}

export function matrixPct(matrix: AttendanceMatrixResult | undefined) {
  if (!matrix || matrix.students.length === 0 || matrix.modules.length === 0)
    return 0;
  const statuses = matrix.students.flatMap((s) => s.attendanceStatuses);
  return attendancePct(statuses);
}

export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface CourseSummary {
  id: number | string;
  code: string;
  name: string;
  term: string;
  students: number;
  attendance: number;
}

export interface AtRiskStudent {
  name: string;
  initials: string;
  course: string;
  attendance: number;
}

export interface TodaySession {
  id: number | string;
  openedAt: string;
  courseCode: string | undefined;
  sectionName: string | null;
  status: string;
  moduleTitle: string;
  studentCount: number;
  courseOfferingId: number | string | undefined;
}

// ── Main hook ────────────────────────────────────────────────────────────────

export function useStaffData() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data: offerings = [], isLoading: loadingOfferings } =
    useGetApiCourseOfferings(
      userId ? { staffUserId: userId } : undefined,
      { query: { enabled: !!userId } },
    );

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

  const matrices = matrixQueries.map((q) => q.data);
  const enrollmentsByCourse = enrollmentQueries.map((q) => q.data ?? []);
  const sessionsByCourse = sessionQueries.map((q) => q.data ?? []);

  const isLoading =
    loadingOfferings ||
    matrixQueries.some((q) => q.isLoading) ||
    enrollmentQueries.some((q) => q.isLoading) ||
    sessionQueries.some((q) => q.isLoading);

  // ── Derived data ─────────────────────────────────────────────────────────

  const courseSummaries: CourseSummary[] = offerings.map((offering, i) => {
    const matrix = matrices[i];
    const enrollments = enrollmentsByCourse[i] ?? [];
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
    enrollmentsByCourse.flatMap((enrs) =>
      enrs.map((e) => String(e.userId)),
    ),
  ).size;

  const allSessions = sessionsByCourse.flatMap((sessions, ci) =>
    sessions.map((session) => ({
      ...session,
      course: offerings[ci] as CourseOfferingDto | undefined,
    })),
  );

  const today = new Date();
  const todaySessions: TodaySession[] = allSessions
    .filter((s) => sameDay(new Date(s.openedAt), today))
    .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime())
    .map((s) => {
      const courseIndex = offerings.findIndex(
        (o) => o.id === s.course?.id,
      );
      const enrollments = s.sectionId
        ? enrollmentsByCourse[courseIndex]?.filter(
            (e) => String(e.sectionId) === String(s.sectionId),
          )
        : enrollmentsByCourse[courseIndex];
      return {
        id: s.id,
        openedAt: s.openedAt,
        courseCode: s.course?.courseCode,
        sectionName: s.sectionName,
        status: s.status,
        moduleTitle: s.moduleTitle,
        studentCount: enrollments?.length ?? 0,
        courseOfferingId: s.course?.id,
      };
    });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSessions = allSessions.filter(
    (s) => new Date(s.openedAt) >= weekAgo,
  );

  const averageAttendance = courseSummaries.length
    ? Math.round(
        courseSummaries.reduce((sum, c) => sum + c.attendance, 0) /
          courseSummaries.length,
      )
    : 0;

  const atRiskStudents: AtRiskStudent[] = matrices
    .flatMap((matrix, ci) =>
      (matrix?.students ?? []).map((student) => ({
        name: student.studentName,
        initials: initials(student.studentName),
        course: offerings[ci]?.courseCode ?? "Course",
        attendance: attendancePct(student.attendanceStatuses),
      })),
    )
    .filter((s) => s.attendance < 60)
    .sort((a, b) => a.attendance - b.attendance)
    .slice(0, 6);

  return {
    userId,
    offerings,
    isLoading,
    courseSummaries,
    totalStudents,
    todaySessions,
    weekSessionCount: weekSessions.length,
    averageAttendance,
    atRiskStudents,
  };
}
