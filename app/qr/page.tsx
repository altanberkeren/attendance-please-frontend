"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import QRCode from "react-qr-code"
import { ArrowRight, Copy, Loader2, QrCode } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function toPositiveSessionId(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export default function QrTestPage() {
  const { isAuthenticated, isReady, signIn, user } = useAuth()
  const [sessionIdInput, setSessionIdInput] = useState("1")
  const [copied, setCopied] = useState(false)

  const sessionId = toPositiveSessionId(sessionIdInput)
  const scanUrl = useMemo(() => {
    if (!sessionId || typeof window === "undefined") return ""
    return `${window.location.origin}/scan?sessionId=${sessionId}`
  }, [sessionId])

  async function copyUrl() {
    if (!scanUrl) return
    await navigator.clipboard.writeText(scanUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="space-y-1 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <QrCode className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">QR Test Page</h1>
          <p className="text-sm text-muted-foreground">
            Prototype page for generating attendance scan links. Keep this simple until the final professor flow is ready.
          </p>
        </div>

        {!isReady ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing authentication...
            </CardContent>
          </Card>
        ) : null}

        {isReady && !isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sign in required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use Microsoft sign-in so the generated QR links match the authenticated scan flow.
              </p>
              <Button onClick={() => signIn("/qr")}>Sign in with Microsoft</Button>
            </CardContent>
          </Card>
        ) : null}

        {isReady && isAuthenticated ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generate sample scan link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sessionId">Session ID</Label>
                  <Input
                    id="sessionId"
                    inputMode="numeric"
                    placeholder="e.g. 123"
                    value={sessionIdInput}
                    onChange={(event) => setSessionIdInput(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is a test helper. In the final version, sessions will be selected/opened from the attendance page.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">Signed in as</p>
                  <p className="text-muted-foreground">{user?.displayName}</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>

                {scanUrl ? (
                  <div className="space-y-2">
                    <Label>Scan URL</Label>
                    <code className="block rounded-md bg-muted p-3 text-xs break-all">{scanUrl}</code>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={copyUrl}>
                        <Copy className="mr-2 h-4 w-4" /> {copied ? "Copied" : "Copy URL"}
                      </Button>
                      <Button asChild>
                        <Link href={scanUrl}>
                          Open scan page <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-destructive">Enter a positive session ID.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">QR Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {scanUrl ? (
                  <div className="rounded-lg border bg-white p-3">
                    <QRCode value={scanUrl} size={260} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">QR appears after entering a valid session ID.</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  )
}
