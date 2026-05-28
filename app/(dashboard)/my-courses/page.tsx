"use client"

import { GraduationCap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MyCoursesPage() {
  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
          <Badge variant="secondary">Work in progress</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Student course list placeholder.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Enrolled courses
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This route is reserved for the student course experience. We will connect it to enrollments later.
        </CardContent>
      </Card>
    </div>
  )
}
