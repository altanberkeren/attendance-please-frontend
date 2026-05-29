"use client"

import Link from "next/link"
import { AlertTriangle, ClipboardCheck, GraduationCap, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useGetApiEnrollmentsMe } from "@/lib/api/enrollments/enrollments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function StudentDashboard() {
  const { user } = useAuth()
  const enrollmentsQuery = useGetApiEnrollmentsMe({ query: { enabled: !!user?.id } })

  const courseCount = enrollmentsQuery.data?.length ?? 0
  const studentStats = [
    { label: "My Courses", value: enrollmentsQuery.isLoading ? "…" : String(courseCount), icon: GraduationCap },
    { label: "Attendance Rate", value: "View", icon: TrendingUp },
    { label: "Marked Modules", value: "View", icon: ClipboardCheck },
    { label: "Warnings", value: "View", icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Student Dashboard</h1>
          <Badge variant="secondary">Student</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your enrolled courses and attendance level.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {studentStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">Per-course details available below</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My course attendance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Open your courses to review attendance charts, status, and module marks.</p>
          <Button asChild className="self-start sm:self-auto">
            <Link href="/my-courses">Open My Courses</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
