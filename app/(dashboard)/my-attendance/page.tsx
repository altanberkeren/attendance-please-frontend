"use client";

import { ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyAttendancePage() {
  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            My Attendance
          </h1>
          <Badge variant="secondary">Moved into My Courses</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Attendance details are shown per course in the student course view.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            View attendance by course
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Select a course to see attendance rate, remaining absences, and
            module-by-module marks.
          </p>
          <Button asChild>
            <Link href="/my-courses">Open My Courses</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
