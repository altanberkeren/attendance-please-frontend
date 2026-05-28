"use client"

import { type FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, QrCode, ShieldAlert } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AttendanceMethod } from "@/lib/api/model/attendanceMethod"
import { usePostApiAttendancesScan } from "@/lib/api/attendances/attendances"
import { useGetApiSessionsId } from "@/lib/api/sessions/sessions"
import { extractStudentIdFromEmail, getUniversityAccountType } from "@/lib/auth/university-account"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const candidate = error as Error & { response?: { data?: { detail?: string; title?: string } } }
    return candidate.response?.data?.detail ?? candidate.response?.data?.title ?? candidate.message
  }

  return "Attendance check-in failed."
}

export default function ScanPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated, isReady, isExchanging, signIn, user } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const sessionIdParam = searchParams.get("sessionId") ?? searchParams.get("session") ?? ""
  const parsedSessionId = Number.parseInt(sessionIdParam, 10)
  const sessionId = Number.isFinite(parsedSessionId) && parsedSessionId > 0 ? parsedSessionId : null

  const returnTo = useMemo(() => {
    const query = searchParams.toString()
    return `${pathname}${query ? `?${query}` : ""}`
  }, [pathname, searchParams])

  const accountType = getUniversityAccountType(user?.email ?? "")
  const studentId = extractStudentIdFromEmail(user?.email ?? "")

  const sessionQuery = useGetApiSessionsId(sessionId ?? 0, {
    query: { enabled: isAuthenticated && !!sessionId },
  })

  const scanMutation = usePostApiAttendancesScan()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!sessionId) {
      setMessage("Invalid QR link. Ask your instructor for a fresh code.")
      return
    }

    if (!user) {
      setMessage("Sign in first, then submit attendance.")
      return
    }

    try {
      const result = await scanMutation.mutateAsync({
        data: {
          sessionId,
          studentUserId: user.id,
          method: AttendanceMethod.Qr,
        },
      })

      setSubmitted(true)
      setMessage(result.message || "Attendance submitted successfully.")
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="space-y-1 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <QrCode className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance Check-In</h1>
          <p className="text-sm text-muted-foreground">Open this page from a classroom QR code.</p>
        </div>

        {!sessionId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4" /> Invalid QR link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>This page needs a valid session ID, for example:</p>
              <code className="block rounded bg-muted p-2 text-xs">/scan?sessionId=123</code>
              <Link href="/qr" className="underline">Open the QR test page</Link>
            </CardContent>
          </Card>
        ) : null}

        {!isReady ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure sign-in...
            </CardContent>
          </Card>
        ) : null}

        {isReady && !isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sign in to continue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use your IUS Microsoft student account. After sign-in, you will return to this QR session.
              </p>
              <Button className="w-full" onClick={() => signIn(returnTo)}>
                Sign in with Microsoft
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isExchanging ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Completing backend sign-in...
            </CardContent>
          </Card>
        ) : null}

        {isReady && isAuthenticated && accountType !== "student" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student account required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Attendance QR submission is limited to <code>@student.ius.edu.ba</code> accounts.</p>
              <p>Signed in as: {user?.email}</p>
              <Link href="/overview" className="underline">Go to dashboard</Link>
            </CardContent>
          </Card>
        ) : null}

        {isReady && isAuthenticated && accountType === "student" && sessionId ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Confirm attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-background p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Session</span>
                  <span className="font-medium">#{sessionId}</span>
                </div>
                {sessionQuery.data ? (
                  <>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-muted-foreground">Module</span>
                      <span className="text-right font-medium">{sessionQuery.data.moduleTitle}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium">{sessionQuery.data.status}</span>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{user?.displayName}</p>
                <p className="text-muted-foreground">{user?.email}</p>
                {studentId ? <p className="text-muted-foreground">Student ID: {studentId}</p> : null}
              </div>

              <form onSubmit={handleSubmit}>
                <Button className="w-full" type="submit" disabled={scanMutation.isPending || submitted}>
                  {scanMutation.isPending ? "Submitting..." : submitted ? "Attendance submitted" : "Sign attendance"}
                </Button>
              </form>

              {message ? (
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  {submitted ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" /> : null}
                  <span>{message}</span>
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}
