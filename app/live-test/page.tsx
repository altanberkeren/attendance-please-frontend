"use client"

import { useEffect, useMemo, useState } from "react"
import QRCode from "react-qr-code"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

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

function loadRows(sessionCode: string): DemoAttendanceRow[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(keyForSession(sessionCode))
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as DemoAttendanceRow[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRows(sessionCode: string, rows: DemoAttendanceRow[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(keyForSession(sessionCode), JSON.stringify(rows))
}

export default function LiveTestPage() {
  const [sessionCode, setSessionCode] = useState("IUS-DEMO-101")
  const [rows, setRows] = useState<DemoAttendanceRow[]>([])

  useEffect(() => {
    setRows(loadRows(sessionCode))
  }, [sessionCode])

  const scanUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/live-test/scan?session=${encodeURIComponent(sessionCode)}`
  }, [sessionCode])

  function updateStatus(rowId: string, status: "Present" | "Failed") {
    const updated = rows.map((row) => (row.id === rowId ? { ...row, status } : row))
    setRows(updated)
    saveRows(sessionCode, updated)
  }

  function clearSession() {
    const updated: DemoAttendanceRow[] = []
    setRows(updated)
    saveRows(sessionCode, updated)
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Temporary Live Demo</h1>
          <p className="text-sm text-muted-foreground">
            Dummy page for testing QR flow without backend/auth.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Professor Demo Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="session-code">Session Code</label>
              <Input
                id="session-code"
                value={sessionCode}
                onChange={(event) => setSessionCode(event.target.value || "IUS-DEMO-101")}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Scan this QR:</p>
                {scanUrl ? (
                  <div className="inline-block rounded-md border bg-white p-3">
                    <QRCode value={scanUrl} size={220} />
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground break-all">{scanUrl}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Quick student link:</p>
                <Link href={scanUrl} className="text-sm underline break-all">{scanUrl}</Link>
                <div>
                  <Button variant="outline" size="sm" onClick={clearSession}>Clear Session Data</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submitted Attendance ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <div className="space-y-2">
                {rows.map((row) => (
                  <div key={row.id} className="flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{row.firstName} {row.lastName} ({row.studentId})</p>
                      <p className="text-xs text-muted-foreground">Submitted: {new Date(row.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{row.status}</span>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(row.id, "Present")}>Present</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(row.id, "Failed")}>Fail</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
