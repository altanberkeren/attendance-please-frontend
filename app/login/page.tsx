"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { setBackendAccessTokenForSession } from "@/lib/auth/backend-token"
import { inferRolesFromEmail, setLocalSessionUser } from "@/lib/auth/local-session"
import { getSignInRedirectUri, type SignInRedirectTarget } from "@/lib/auth/msal-config"
import { getUniversityAccountType } from "@/lib/auth/university-account"

const STATS = [
  { value: "2,400+", label: "Students tracked" },
  { value: "98%", label: "Uptime" },
  { value: "50+", label: "Institutions" },
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5176"
const REDIRECT_CHOICES: Array<{ target: SignInRedirectTarget; label: string }> = [
  { target: "origin", label: "Sign in with Microsoft" },
  { target: "authNoSlash", label: "Try /auth callback" },
  { target: "auth", label: "Try /auth/ callback" },
]

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isReady, signIn } = useAuth()
  const [signingInTarget, setSigningInTarget] = useState<SignInRedirectTarget | null>(null)
  const [isQuickAccessing, setIsQuickAccessing] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [quickName, setQuickName] = useState("")
  const [quickEmail, setQuickEmail] = useState("")
  const [quickError, setQuickError] = useState<string | null>(null)

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/overview")
    }
  }, [isAuthenticated, isReady, router])

  async function handleSignIn(target: SignInRedirectTarget) {
    setAuthError(null)
    setQuickError(null)
    setSigningInTarget(target)

    try {
      await signIn(target)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed. Please try again."
      setAuthError(message)
      setSigningInTarget(null)
    }
  }

  async function handleQuickAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuickError(null)
    setAuthError(null)
    setIsQuickAccessing(true)

    const normalizedEmail = quickEmail.trim().toLowerCase()
    if (!normalizedEmail) {
      setQuickError("Enter your university email.")
      setIsQuickAccessing(false)
      return
    }

    const accountType = getUniversityAccountType(normalizedEmail)
    if (accountType === "external") {
      setQuickError("Use an IUS email: @student.ius.edu.ba or @ius.edu.ba.")
      setIsQuickAccessing(false)
      return
    }

    const displayName = quickName.trim() || normalizedEmail.split("@")[0]
    setLocalSessionUser({
      displayName,
      email: normalizedEmail,
      roles: inferRolesFromEmail(normalizedEmail),
    })

    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/azure-exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, email: normalizedEmail }),
      })

      if (response.ok) {
        const body = (await response.json()) as { token?: string }
        if (body.token) {
          setBackendAccessTokenForSession(body.token)
        }
      }
    } catch {
      // Keep test access available even if API is unreachable.
    }

    router.replace("/overview")
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-20 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-32 -right-8 h-40 w-40 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3">
          <Image
            src="/ius-logo-medium.png"
            alt="IUS Logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-xl font-bold tracking-tight">AttendanceApp</span>
        </div>

        <div className="relative flex-1 flex flex-col justify-center gap-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary-foreground/60 uppercase tracking-widest">
              Attendance Management
            </p>
            <h1 className="text-4xl font-bold leading-tight">
              Track attendance.
              <br />
              Save time.
              <br />
              Stay informed.
            </h1>
            <p className="text-primary-foreground/70 text-sm max-w-xs leading-relaxed">
              A modern attendance system built for universities and institutions of all sizes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["QR Scanning", "Real-time Reports", "Role-based Access", "Dark Mode"].map((feature) => (
              <span
                key={feature}
                className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-primary-foreground/80 border border-white/10"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="relative pt-8 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-primary-foreground/50 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2 text-primary font-bold">
            <Image
              src="/ius-logo-medium.png"
              alt="IUS Logo"
              width={24}
              height={24}
              className="rounded"
            />
            AttendanceApp
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in with your Microsoft account to continue.</p>
          </div>

          <div className="space-y-3">
            {REDIRECT_CHOICES.map(({ target, label }, index) => (
              <Button
                key={target}
                type="button"
                variant={index === 0 ? "default" : "ghost"}
                className="w-full gap-2"
                onClick={() => handleSignIn(target)}
                disabled={!isReady || signingInTarget !== null}
              >
                {signingInTarget === target ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting to Microsoft...
                  </>
                ) : (
                  <>
                    {label}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ))}

            {!isReady && <p className="text-xs text-muted-foreground text-center">Preparing secure sign-in...</p>}

            <p className="text-[11px] text-center text-muted-foreground">
              Primary callback: <code>{getSignInRedirectUri("origin")}</code>
            </p>
            <p className="text-[11px] text-center text-muted-foreground">
              Alternate callback: <code>{getSignInRedirectUri("authNoSlash")}</code>
            </p>
            <p className="text-[11px] text-center text-muted-foreground">
              Fallback callback: <code>{getSignInRedirectUri("auth")}</code>
            </p>

            {authError && (
              <p className="text-xs text-destructive text-center break-words" role="alert">
                {authError}
              </p>
            )}

            <div className="pt-2">
              <Separator />
              <p className="mt-3 text-xs text-muted-foreground">
                If Azure redirect is blocked, use temporary test access.
              </p>
              <form className="mt-3 space-y-3" onSubmit={handleQuickAccess}>
                <div className="space-y-1.5">
                  <Label htmlFor="quickName">Name</Label>
                  <Input
                    id="quickName"
                    value={quickName}
                    onChange={(event) => setQuickName(event.target.value)}
                    placeholder="Student Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quickEmail">University Email</Label>
                  <Input
                    id="quickEmail"
                    value={quickEmail}
                    onChange={(event) => setQuickEmail(event.target.value)}
                    placeholder="220302221@student.ius.edu.ba"
                    required
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={isQuickAccessing}>
                  {isQuickAccessing ? "Opening..." : "Continue with Test Access"}
                </Button>
              </form>
              {quickError ? (
                <p className="mt-2 text-xs text-destructive break-words" role="alert">
                  {quickError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
