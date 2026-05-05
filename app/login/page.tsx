"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, GraduationCap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

const STATS = [
  { value: "2,400+", label: "Students tracked" },
  { value: "98%", label: "Uptime" },
  { value: "50+", label: "Institutions" },
]

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isReady, signIn } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/overview")
    }
  }, [isAuthenticated, isReady, router])

  async function handleSignIn() {
    setAuthError(null)
    setIsSigningIn(true)

    try {
      await signIn()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed. Please try again."
      setAuthError(message)
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-20 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-32 -right-8 h-40 w-40 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
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
            <GraduationCap className="h-5 w-5" />
            AttendanceApp
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in with your Microsoft account to continue.</p>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              className="w-full gap-2"
              onClick={handleSignIn}
              disabled={!isReady || isSigningIn}
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to Microsoft...
                </>
              ) : (
                <>
                  Sign in with Microsoft
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {!isReady && <p className="text-xs text-muted-foreground text-center">Preparing secure sign-in...</p>}

            {authError && (
              <p className="text-xs text-destructive text-center break-words" role="alert">
                {authError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
