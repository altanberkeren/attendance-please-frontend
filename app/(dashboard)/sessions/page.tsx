"use client"

import { useRouter } from "next/navigation"
import { CalendarCheck, Loader2, Users } from "lucide-react"
import { useGetApiSessions } from "@/lib/api/sessions/sessions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SessionStatus } from "@/lib/api/model"

function statusBadge(status: string) {
  if (status === SessionStatus.Open)
    return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Open</Badge>
  if (status === SessionStatus.Canceled)
    return <Badge variant="destructive">Canceled</Badge>
  return <Badge variant="secondary">Closed</Badge>
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function SessionsPage() {
  const router = useRouter()
  const { data: sessions, isLoading } = useGetApiSessions()

  const sorted = [...(sessions ?? [])].sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="text-sm text-muted-foreground">
          {sorted.length} session{sorted.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No sessions yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Open a session from a course offering.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((s) => (
          <Card
            key={String(s.id)}
            className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{s.moduleTitle}</p>
                  <p className="text-xs text-muted-foreground">{s.sectionName ?? "All sections"}</p>
                </div>
                {statusBadge(s.status)}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Method: <span className="text-foreground font-medium">{s.selectedMethod}</span></p>
                <p>Opened: <span className="text-foreground">{fmt(s.openedAt)}</span></p>
                <p>By: <span className="text-foreground">{s.openedByUserName}</span></p>
              </div>
              <Button
                size="sm"
                className="w-full h-7 text-xs gap-1.5"
                onClick={() => router.push(`/sessions/${s.id}`)}
              >
                <Users className="h-3.5 w-3.5" />
                Attendance
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
