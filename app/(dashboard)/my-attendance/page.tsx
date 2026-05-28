"use client"

import { ClipboardCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MyAttendancePage() {
  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">My Attendance</h1>
          <Badge variant="secondary">Work in progress</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Student attendance summary placeholder.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Attendance level
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This route is reserved for per-course attendance summaries. We will connect it to attendance overview later.
        </CardContent>
      </Card>
    </div>
  )
}
