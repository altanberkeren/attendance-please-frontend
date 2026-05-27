"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Clock, XCircle, AlertCircle, Square, Ban } from "lucide-react"
import { useGetApiSessionsId, usePostApiSessionsIdClose, usePostApiSessionsIdCancel } from "@/lib/api/sessions/sessions"
import { useGetApiAttendancesSessionSessionId, usePostApiAttendancesMark } from "@/lib/api/attendances/attendances"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AttendanceStatus, SessionStatus, AttendanceMethod } from "@/lib/api/model"

function statusBadge(status: string) {
  if (status === SessionStatus.Open)
    return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Open</Badge>
  if (status === SessionStatus.Canceled)
    return <Badge variant="destructive">Canceled</Badge>
  return <Badge variant="secondary">Closed</Badge>
}

function attendanceBadge(status: string) {
  switch (status) {
    case AttendanceStatus.Present:
      return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Present</Badge>
    case AttendanceStatus.Late:
      return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">Late</Badge>
    case AttendanceStatus.Excused:
      return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">Excused</Badge>
    case AttendanceStatus.Absent:
      return <Badge variant="destructive">Absent</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

type Params = { id: string }

export default function SessionDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const { data: session, isLoading: loadingSession } = useGetApiSessionsId(id)
  const { data: attendances, isLoading: loadingAttendances } = useGetApiAttendancesSessionSessionId(id)

  const closeSession = usePostApiSessionsIdClose({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/Sessions/${id}`] }) },
  })
  const cancelSession = usePostApiSessionsIdCancel({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/Sessions/${id}`] }) },
  })
  const markAttendance = usePostApiAttendancesMark({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`/api/Attendances/session/${id}`] })
      },
    },
  })

  function handleMark(userId: number | string, status: string) {
    if (!session) return
    markAttendance.mutate({
      data: {
        userId,
        sessionId: id,
        status: status as AttendanceStatus,
        method: session.selectedMethod ?? AttendanceMethod.Manual,
      },
    })
  }

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:underline">← Back</button>
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    )
  }

  const isOpen = session.status === SessionStatus.Open

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/sessions">Sessions</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{session.moduleTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Session info card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{session.moduleTitle}</CardTitle>
            {statusBadge(session.status)}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Section</p>
            <p className="font-medium">{session.sectionName ?? "All sections"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Method</p>
            <p className="font-medium">{session.selectedMethod}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Opened at</p>
            <p className="font-medium">{fmt(session.openedAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Opened by</p>
            <p className="font-medium">{session.openedByUserName}</p>
          </div>
        </CardContent>
        {isOpen && (
          <CardContent className="pt-0 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => closeSession.mutate({ id })}
              disabled={closeSession.isPending}
            >
              {closeSession.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
              Close Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive border-destructive/30"
              onClick={() => cancelSession.mutate({ id })}
              disabled={cancelSession.isPending}
            >
              {cancelSession.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
              Cancel Session
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Attendance table */}
      <div>
        <h2 className="text-base font-semibold mb-3">
          Attendance ({attendances?.length ?? 0} students)
        </h2>
        {loadingAttendances ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recorded at</TableHead>
                  {isOpen && <TableHead className="text-right">Mark</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(attendances ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isOpen ? 4 : 3} className="h-20 text-center text-muted-foreground">
                      No attendance records yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (attendances ?? []).map((a) => (
                    <TableRow key={String(a.id)}>
                      <TableCell className="font-medium">{a.userName}</TableCell>
                      <TableCell>{attendanceBadge(a.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.recordedAt ? fmt(a.recordedAt) : "—"}
                      </TableCell>
                      {isOpen && (
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {Object.values(AttendanceStatus).map((s) => (
                              <Button
                                key={s}
                                variant={a.status === s ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => handleMark(a.userId, s)}
                                disabled={markAttendance.isPending}
                              >
                                {s}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
