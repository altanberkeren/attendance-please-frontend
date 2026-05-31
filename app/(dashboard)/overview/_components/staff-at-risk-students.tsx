"use client";

import { AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AtRiskStudent } from "./use-staff-data";

interface StaffAtRiskStudentsProps {
  students: AtRiskStudent[];
}

export function StaffAtRiskStudents({ students }: StaffAtRiskStudentsProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-sm font-medium">
            At-Risk Students
          </CardTitle>
          <Badge variant="destructive" className="ml-auto text-xs">
            {students.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {students.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No students below the threshold.
          </p>
        ) : (
          students.map((student) => (
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
  );
}
