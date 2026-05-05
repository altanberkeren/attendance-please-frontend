"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { GraduationCap, ArrowRight } from "lucide-react"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})
type LoginValues = z.infer<typeof loginSchema>

const STATS = [
  { value: "2,400+", label: "Students tracked" },
  { value: "98%",    label: "Uptime" },
  { value: "50+",    label: "Institutions" },
]

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") router.replace("/overview")
  }, [router])

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(_values: LoginValues) {
    localStorage.setItem("isLoggedIn", "true")
    router.push("/overview")
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left brand panel ────────────────────────────────── */}
      <div className="hidden lg:flex flex-col bg-primary text-primary-foreground p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-20 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-32 -right-8 h-40 w-40 rounded-full bg-white/10" />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">AttendanceApp</span>
        </div>

        {/* Hero copy */}
        <div className="relative flex-1 flex flex-col justify-center gap-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary-foreground/60 uppercase tracking-widest">
              Attendance Management
            </p>
            <h1 className="text-4xl font-bold leading-tight">
              Track attendance.<br />
              Save time.<br />
              Stay informed.
            </h1>
            <p className="text-primary-foreground/70 text-sm max-w-xs leading-relaxed">
              A modern attendance system built for universities and institutions of all sizes.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {["QR Scanning", "Real-time Reports", "Role-based Access", "Dark Mode"].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-primary-foreground/80 border border-white/10"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative pt-8 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-primary-foreground/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────── */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 text-primary font-bold">
            <GraduationCap className="h-5 w-5" />
            AttendanceApp
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin@university.edu"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full gap-2 mt-2">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </Form>

          {/* Demo hint */}
          <p className="text-xs text-center text-muted-foreground">
            Demo mode — enter any email and password to sign in
          </p>
        </div>
      </div>
    </div>
  )
}
