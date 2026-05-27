"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AttendanceMethod } from "@/lib/api/model/attendanceMethod"
import { usePostApiAttendancesScan } from "@/lib/api/attendances/attendances"
import { useGetApiSessionsId } from "@/lib/api/sessions/sessions"
import { extractStudentIdFromEmail, getUniversityAccountType } from "@/lib/auth/university-account"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function splitName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { firstName: "", lastName: "" }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  }
}

export default function ScanPage() {
  const searchParams = useSearchParams()
  const { isAuthenticated, isReady, signIn, user } = useAuth()

  const sessionIdParam = searchParams.get("sessionId") ?? ""
  const parsedSessionId = Number.parseInt(sessionIdParam, 10)
  const sessionId = Number.isFinite(parsedSessionId) && parsedSessionId > 0 ? parsedSessionId : null

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const scanMutation = usePostApiAttendancesScan()

  const sessionQuery = useGetApiSessionsId(sessionId ?? 0, {
    query: { enabled: !!sessionId },
  })

  const expectedStudentId = useMemo(
    () => extractStudentIdFromEmail(user?.email ?? "") ?? "",
    [user?.email],
  )

  const profileName = useMemo(() => splitName(user?.displayName ?? ""), [user?.displayName])

  useEffect(() => {
    if (!isAuthenticated) return

    setFirstName((prev) => prev || profileName.firstName)
    setLastName((prev) => prev || profileName.lastName)
    setStudentId((prev) => prev || expectedStudentId)
  }, [expectedStudentId, isAuthenticated, profileName.firstName, profileName.lastName])

  const accountType = getUniversityAccountType(user?.email ?? "")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!sessionId) {
      setMessage("Invalid session link. Ask your professor for a new QR code.")
      return
    }

    if (!firstName.trim() || !lastName.trim() || !studentId.trim()) {
      setMessage("Please complete first name, last name, and student ID.")
      return
    }

    if (expectedStudentId && expectedStudentId !== studentId.trim()) {
      setMessage("Student ID must match your university student email.")
      return
    }

    try {
      const result = await scanMutation.mutateAsync({
        data: {
          sessionId,
          studentUserId: 0,
          method: AttendanceMethod.Qr,
        },
      })

      setMessage(result.message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Attendance scan failed.")
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Attendance Check-In</h1>
          <p className="text-sm text-muted-foreground">Scan page for IUS attendance QR sessions.</p>
        </div>

        {!isReady ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">Preparing authentication...</CardContent>
          </Card>
        ) : null}

        {isReady && !isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sign in required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Use your Microsoft account before submitting attendance.</p>
              <Button onClick={() => signIn()}>Sign in with Microsoft</Button>
            </CardContent>
          </Card>
        ) : null}

        {isReady && isAuthenticated && accountType !== "student" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student account required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This page accepts only <code>@student.ius.edu.ba</code> accounts.
              </p>
              <p className="text-xs text-muted-foreground">Signed in as: {user?.email}</p>
              <Link href="/attendance" className="text-sm underline">Go to Attendance Dashboard</Link>
            </CardContent>
          </Card>
        ) : null}

        {isReady && isAuthenticated && accountType === "student" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submit Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded border bg-muted/40 p-3 text-xs text-muted-foreground">
                <p>Session ID: {sessionId ?? "Invalid"}</p>
                {sessionQuery.data ? <p>Module: {sessionQuery.data.moduleTitle}</p> : null}
                {sessionQuery.data ? <p>Status: {sessionQuery.data.status}</p> : null}
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input id="studentId" value={studentId} onChange={(event) => setStudentId(event.target.value)} />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Signed in as: {user?.email}</p>
                  {expectedStudentId ? (
                    <p className="text-xs text-muted-foreground">Expected ID from email: {expectedStudentId}</p>
                  ) : null}
                </div>

                <Button type="submit" className="w-full" disabled={scanMutation.isPending || !sessionId}>
                  {scanMutation.isPending ? "Submitting..." : "Submit Attendance"}
                </Button>
              </form>

              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
