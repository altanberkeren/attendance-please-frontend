"use client";

import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

interface StaffStatsCardsProps {
  totalStudents: number;
  courseCount: number;
  weekSessionCount: number;
  averageAttendance: number;
  atRiskCount: number;
}

export function StaffStatsCards({
  totalStudents,
  courseCount,
  weekSessionCount,
  averageAttendance,
  atRiskCount,
}: StaffStatsCardsProps) {
  const stats: StatItem[] = [
    {
      label: "My Students",
      value: String(totalStudents),
      change: `across ${courseCount} course${courseCount !== 1 ? "s" : ""}`,
      up: true,
      icon: Users,
    },
    {
      label: "This Week",
      value: String(weekSessionCount),
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
      value: String(atRiskCount),
      change: "below 60% threshold",
      up: atRiskCount === 0,
      icon: AlertTriangle,
    },
  ];

  return (
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
  );
}
