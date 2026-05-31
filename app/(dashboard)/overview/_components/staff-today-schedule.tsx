"use client";

import { CalendarCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TodaySession } from "./use-staff-data";
import { formatTime } from "./use-staff-data";

interface StaffTodayScheduleProps {
  sessions: TodaySession[];
}

export function StaffTodaySchedule({ sessions }: StaffTodayScheduleProps) {
  const router = useRouter();

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Today&apos;s Schedule
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {sessions.length} sessions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sessions scheduled today.
          </p>
        ) : (
          sessions.map((session) => (
            <button
              type="button"
              key={String(session.id)}
              onClick={() =>
                router.push(
                  `/sessions/detail?id=${encodeURIComponent(String(session.id))}${session.courseOfferingId ? `&courseOfferingId=${encodeURIComponent(String(session.courseOfferingId))}` : ""}`,
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
                    {session.courseCode ?? "Course"}
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
                <p className="text-sm font-bold">{session.studentCount}</p>
                <p className="text-[10px] text-muted-foreground">students</p>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
