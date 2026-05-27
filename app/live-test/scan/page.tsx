"use client"

import { FormEvent, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type DemoAttendanceRow = {
  id: string
  firstName: string
  lastName: string
  studentId: string
  status: "Present" | "Failed"
  submittedAt: string
}

function keyForSession(sessionCode: string): string {
  return `demo-attendance-${sessionCode}`
}

function appendOrUpdateRow(sessionCode: string, next: DemoAttendanceRow) {
  if (typeof window === "undefined") return

  const raw = window.localStorage.getItem(keyForSession(sessionCode))
  const existing = raw ? (JSON.parse(raw) as DemoAttendanceRow[]) : []
  const rows = Array.isArray(existing) ? existing : []

  const foundIndex = rows.findIndex((row) => row.studentId === next.studentId)
  if (foundIndex >= 0) {
    rows[foundIndex] = { ...rows[foundIndex], ...next }
  } else {
    rows.push(next)
  }

  window.localStorage.setItem(keyForSession(sessionCode), JSON.stringify(rows))
}

export default function LiveTestScanPage() {
  const searchParams = useSearchParams()
  const sessionCode = searchParams.get("session") || "IUS-DEMO-101"

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const backUrl = useMemo(() => `/live-test?session=${encodeURIComponent(sessionCode)}`, [sessionCode])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!firstName.trim() || !lastName.trim() || !studentId.trim()) {
      setMessage("Please fill first name, last name, and student ID.")
      return
    }

    const row: DemoAttendanceRow = {
      id: `${studentId.trim()}-${sessionCode}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      studentId: studentId.trim(),
      status: "Present",
      submittedAt: new Date().toISOString(),
    }

    appendOrUpdateRow(sessionCode, row)
    setMessage("Attendance submitted successfully in demo mode.")
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Student Demo Check-In</h1>
          <p className="text-sm text-muted-foreground">Temporary page for live testing.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session: {sessionCode}</CardTitle>
          </CardHeader>
          <CardContent>
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

              <Button className="w-full" type="submit">Submit Demo Attendance</Button>
            </form>

            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}

            <p className="mt-3 text-xs text-muted-foreground">
              Open <Link href="/live-test" className="underline">/live-test</Link> on professor device to review and fail/present.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Direct return link: <Link href={backUrl} className="underline">{backUrl}</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
