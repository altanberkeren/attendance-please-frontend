"use client"

import { useMemo, useState } from "react"
import QRCode from "react-qr-code"
import { useAuth } from "@/hooks/use-auth"
import { getUniversityAccountType } from "@/lib/auth/university-account"
import { useGetApiAttendancesSessionSessionId, usePostApiAttendancesMark } from "@/lib/api/attendances/attendances"
import { AttendanceMethod } from "@/lib/api/model/attendanceMethod"
import { AttendanceStatus } from "@/lib/api/model/attendanceStatus"
import { useGetApiEnrollments } from "@/lib/api/enrollments/enrollments"
import { useGetApiModules, usePostApiModules } from "@/lib/api/modules/modules"
import { useGetApiSessions, usePostApiSessions } from "@/lib/api/sessions/sessions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function toPositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function extractId(payload: unknown): number | null {
  if (typeof payload === "number" && Number.isFinite(payload) && payload > 0) return payload
  if (typeof payload === "string") {
    const parsed = Number.parseInt(payload, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }
  if (payload && typeof payload === "object" && "id" in payload) {
    const idValue = (payload as { id?: unknown }).id
    if (typeof idValue === "number" && Number.isFinite(idValue) && idValue > 0) return idValue
    if (typeof idValue === "string") {
      const parsed = Number.parseInt(idValue, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }
  }
  return null
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const candidate = error as Error & {
      response?: { data?: { detail?: string; title?: string; errors?: Record<string, string[]> } }
    }

    const detail = candidate.response?.data?.detail
    if (detail?.trim()) return detail

    const title = candidate.response?.data?.title
    if (title?.trim()) return title

    const validationErrors = candidate.response?.data?.errors
    if (validationErrors) {
      const firstField = Object.keys(validationErrors)[0]
      if (firstField) {
        const firstMessage = validationErrors[firstField]?.[0]
        if (firstMessage) return firstMessage
      }
    }

    return candidate.message || fallback
  }

  return fallback
}

const WEEK_OPTIONS = Array.from({ length: 16 }, (_, index) => {
  const week = index + 1
  return {
    value: String(week),
    label: `Week ${week}`,
  }
})

function extractSessionIdFromOpenResponse(payload: unknown): number | null {
  if (typeof payload === "number" && Number.isFinite(payload) && payload > 0) {
    return payload
  }

  if (typeof payload === "string") {
    const parsed = Number.parseInt(payload, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  if (payload && typeof payload === "object" && "id" in payload) {
    const idValue = (payload as { id?: unknown }).id
    if (typeof idValue === "number" && Number.isFinite(idValue) && idValue > 0) {
      return idValue
    }
    if (typeof idValue === "string") {
      const parsed = Number.parseInt(idValue, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }
  }

  return null
}

export default function AttendancePage() {
  const { user } = useAuth()

  const [courseOfferingIdInput, setCourseOfferingIdInput] = useState("")
  const [moduleIdInput, setModuleIdInput] = useState("")
  const [sectionIdInput, setSectionIdInput] = useState("")
  const [selectedSessionIdInput, setSelectedSessionIdInput] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const accountType = getUniversityAccountType(user?.email ?? "")
  const canManageAttendance =
    accountType === "staff" ||
    user?.roles.includes("Staff") ||
    user?.roles.includes("Admin")

  const courseOfferingId = toPositiveInt(courseOfferingIdInput)
  const selectedSessionId = toPositiveInt(selectedSessionIdInput)
  const selectedWeek = toPositiveInt(moduleIdInput)

  const modulesQuery = useGetApiModules(
    courseOfferingId ? { courseOfferingId } : undefined,
    { query: { enabled: canManageAttendance && !!courseOfferingId } },
  )

  const sessionsQuery = useGetApiSessions(
    courseOfferingId ? { courseOfferingId } : undefined,
    { query: { enabled: canManageAttendance && !!courseOfferingId } },
  )

  const enrollmentsQuery = useGetApiEnrollments(
    courseOfferingId ? { courseOfferingId } : undefined,
    { query: { enabled: canManageAttendance && !!courseOfferingId } },
  )

  const attendanceQuery = useGetApiAttendancesSessionSessionId(
    selectedSessionId ?? 0,
    {
      query: {
        enabled: canManageAttendance && !!selectedSessionId,
        refetchInterval: 5000,
      },
    },
  )

  const openSessionMutation = usePostApiSessions()
  const createModuleMutation = usePostApiModules()
  const markAttendanceMutation = usePostApiAttendancesMark()

  const attendanceByUserId = useMemo(() => {
    const map = new Map<number, { status: string; attendanceId: number | string }>()
    for (const row of attendanceQuery.data ?? []) {
      const userId = Number(row.userId)
      if (Number.isFinite(userId)) {
        map.set(userId, { status: row.status, attendanceId: row.id })
      }
    }
    return map
  }, [attendanceQuery.data])

  const scanUrl = useMemo(() => {
    if (!selectedSessionId || typeof window === "undefined") return ""
    return `${window.location.origin}/scan?sessionId=${selectedSessionId}`
  }, [selectedSessionId])

  async function resolveModuleIdForSelectedWeek(week: number): Promise<number> {
    if (!courseOfferingId) {
      throw new Error("Enter Course Offering ID first.")
    }

    const targetTitle = `week ${week}`

    const getExistingModuleId = (modules: Array<{ id: number | string; title: string; orderIndex: number | string }>): number | null => {
      const found = modules.find((module) => {
        const order = Number(module.orderIndex)
        if (Number.isFinite(order) && order === week) return true
        return normalizeTitle(module.title) === targetTitle
      })
      if (!found) return null
      return extractId(found.id)
    }

    let modules = modulesQuery.data ?? []
    if (modules.length === 0) {
      const fetched = await modulesQuery.refetch()
      modules = fetched.data ?? []
    }

    const existingId = getExistingModuleId(modules)
    if (existingId) return existingId

    const created = await createModuleMutation.mutateAsync({
      data: {
        courseOfferingId,
        title: `Week ${week}`,
        orderIndex: week,
      },
    })

    const createdId = extractId(created)
    if (createdId) {
      await modulesQuery.refetch()
      return createdId
    }

    const refreshed = await modulesQuery.refetch()
    const fallbackId = getExistingModuleId(refreshed.data ?? [])
    if (fallbackId) return fallbackId

    throw new Error(`Could not resolve module for Week ${week}.`)
  }

  async function handleOpenSession() {
    if (!courseOfferingId) {
      setStatusMessage("Enter Course Offering ID first.")
      return
    }

    if (!selectedWeek || selectedWeek < 1 || selectedWeek > 16) {
      setStatusMessage("Pick a valid week (Week 1 to Week 16).")
      return
    }

    const sectionId = sectionIdInput.trim() ? toPositiveInt(sectionIdInput.trim()) : null
    if (sectionIdInput.trim() && !sectionId) {
      setStatusMessage("Section ID must be a positive number.")
      return
    }

    try {
      const moduleId = await resolveModuleIdForSelectedWeek(selectedWeek)

      const response = await openSessionMutation.mutateAsync({
        data: {
          moduleId,
          sectionId,
          selectedMethod: AttendanceMethod.Qr,
          openedByUserId: 0,
        },
      })

      const sessionId = extractSessionIdFromOpenResponse(response)
      if (!sessionId) {
        setStatusMessage("Session opened but session ID could not be parsed. Select it manually from the Sessions list.")
        await sessionsQuery.refetch()
        return
      }

      setSelectedSessionIdInput(String(sessionId))
      setStatusMessage(`Week ${selectedWeek} session ${sessionId} opened. QR code is ready.`)
      await sessionsQuery.refetch()
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Failed to open session."))
    }
  }

  async function handleMark(userId: number | string, status: "Present" | "Absent") {
    if (!selectedSessionId) {
      setStatusMessage("Select a session first.")
      return
    }

    try {
      await markAttendanceMutation.mutateAsync({
        data: {
          userId,
          sessionId: selectedSessionId,
          status: status === "Present" ? AttendanceStatus.Present : AttendanceStatus.Absent,
          method: AttendanceMethod.Manual,
        },
      })

      await attendanceQuery.refetch()
      setStatusMessage(status === "Present" ? "Attendance marked present." : "Attendance failed (marked absent).")
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Failed to update attendance."))
    }
  }

  if (!canManageAttendance) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Staff/professor access is required for the QR builder.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Attendance QR Builder</h1>
        <p className="text-sm text-muted-foreground">
          Open a session, project the QR code, and review/fail attendance in real time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="courseOfferingId">Course Offering ID</Label>
              <Input
                id="courseOfferingId"
                placeholder="e.g. 7"
                value={courseOfferingIdInput}
                onChange={(event) => setCourseOfferingIdInput(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="moduleId">Module</Label>
              <select
                id="moduleId"
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={moduleIdInput}
                onChange={(event) => setModuleIdInput(event.target.value)}
              >
                <option value="">Select module</option>
                {WEEK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sectionId">Section ID (Optional)</Label>
              <Input
                id="sectionId"
                placeholder="e.g. 2"
                value={sectionIdInput}
                onChange={(event) => setSectionIdInput(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="selectedSessionId">Active Session ID</Label>
              <Input
                id="selectedSessionId"
                placeholder="Set manually or choose below"
                value={selectedSessionIdInput}
                onChange={(event) => setSelectedSessionIdInput(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleOpenSession} disabled={openSessionMutation.isPending || !courseOfferingId}>
              {openSessionMutation.isPending ? "Opening..." : "Open Session + Generate QR"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                sessionsQuery.refetch()
                enrollmentsQuery.refetch()
                if (selectedSessionId) {
                  attendanceQuery.refetch()
                }
              }}
            >
              Refresh Data
            </Button>
          </div>

          {statusMessage ? (
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scanUrl ? (
              <div className="w-full max-w-xs rounded-md border bg-white p-3">
                <QRCode value={scanUrl} size={280} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Open or select a session to generate QR.</p>
            )}

            {scanUrl ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Scan URL</p>
                <code className="block rounded bg-muted p-2 text-xs break-all">{scanUrl}</code>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(sessionsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions loaded for this offering.</p>
            ) : (
              (sessionsQuery.data ?? []).map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded border p-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Session #{session.id} - {session.moduleTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: <Badge variant={session.status === "Open" ? "default" : "secondary"}>{session.status}</Badge>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSessionIdInput(String(session.id))}
                  >
                    Use
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Attendance Review</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedSessionId ? (
            <p className="text-sm text-muted-foreground">Select an active session to review attendance.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(enrollmentsQuery.data ?? []).map((enrollment) => {
                    const currentAttendance = attendanceByUserId.get(Number(enrollment.userId))
                    const status = currentAttendance?.status ?? "Not marked"

                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.userName}</TableCell>
                        <TableCell>{enrollment.userId}</TableCell>
                        <TableCell>{enrollment.sectionName}</TableCell>
                        <TableCell>
                          <Badge variant={status === "Absent" ? "destructive" : status === "Present" ? "default" : "secondary"}>
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={markAttendanceMutation.isPending}
                            onClick={() => handleMark(enrollment.userId, "Present")}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={markAttendanceMutation.isPending}
                            onClick={() => handleMark(enrollment.userId, "Absent")}
                          >
                            Fail
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {(enrollmentsQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                        No enrolled students found for this course offering.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
