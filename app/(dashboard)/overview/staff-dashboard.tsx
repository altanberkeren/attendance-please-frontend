import { Activity, ClipboardCheck, GraduationCap, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const STAFF_STATS = [
  { label: "Assigned Courses", value: "—", icon: GraduationCap },
  { label: "Open Sessions", value: "—", icon: Activity },
  { label: "Students", value: "—", icon: Users },
  { label: "Avg Attendance", value: "—", icon: ClipboardCheck },
]

export function StaffDashboard() {
  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Staff Dashboard</h1>
          <Badge variant="secondary">Work in progress</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Teaching tools, assigned courses, and attendance workflows will be completed here.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAFF_STATS.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">Pending staff API/view integration</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next staff work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Staff navigation is separated now. We can later replace this placeholder with assigned course
          queries, active sessions, and quick attendance actions.
        </CardContent>
      </Card>
    </div>
  )
}
