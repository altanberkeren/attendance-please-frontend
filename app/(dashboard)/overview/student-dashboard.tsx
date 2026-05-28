import { AlertTriangle, ClipboardCheck, GraduationCap, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const STUDENT_STATS = [
  { label: "My Courses", value: "—", icon: GraduationCap },
  { label: "Attendance Rate", value: "—", icon: TrendingUp },
  { label: "Present", value: "—", icon: ClipboardCheck },
  { label: "Warnings", value: "—", icon: AlertTriangle },
]

export function StudentDashboard() {
  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Student Dashboard</h1>
          <Badge variant="secondary">Work in progress</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Your enrolled courses and attendance level will be shown here.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STUDENT_STATS.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">Pending student API/view integration</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next student work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Student navigation is separated now. We can later add enrolled courses and per-course
          attendance summaries using the enrollment and attendance overview APIs.
        </CardContent>
      </Card>
    </div>
  )
}
