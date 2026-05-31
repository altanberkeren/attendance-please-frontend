"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "./use-staff-data";

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

interface StaffCourseAttendanceProps {
  courses: CourseSummary[];
}

export function StaffCourseAttendance({ courses }: StaffCourseAttendanceProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Attendance Rate by Course
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {courses.map((course) => (
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
  );
}
