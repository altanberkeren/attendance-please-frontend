"use client";

import { ChevronRight, Loader2, Scan } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StaffAtRiskStudents } from "./staff-at-risk-students";
import { StaffCourseAttendance } from "./staff-course-attendance";
import { StaffStatsCards } from "./staff-stats-cards";
import { StaffTodaySchedule } from "./staff-today-schedule";
import { useStaffData } from "./use-staff-data";

export function StaffOverview() {
  const router = useRouter();
  const {
    offerings,
    isLoading,
    courseSummaries,
    totalStudents,
    todaySessions,
    weekSessionCount,
    averageAttendance,
    atRiskStudents,
  } = useStaffData();

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
          <StaffStatsCards
            totalStudents={totalStudents}
            courseCount={offerings.length}
            weekSessionCount={weekSessionCount}
            averageAttendance={averageAttendance}
            atRiskCount={atRiskStudents.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <StaffTodaySchedule sessions={todaySessions} />
            <StaffAtRiskStudents students={atRiskStudents} />
          </div>

          <StaffCourseAttendance courses={courseSummaries} />
        </>
      )}
    </div>
  );
}
