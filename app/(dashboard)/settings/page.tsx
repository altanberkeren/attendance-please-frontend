"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Bell, Shield, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// ── Schemas ────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  email:     z.string().email("Must be a valid email address"),
  title:     z.string().optional(),
})

const passwordSchema = z.object({
  current:  z.string().min(1, "Current password is required"),
  next:     z.string().min(8, "Must be at least 8 characters"),
  confirm:  z.string().min(1, "Please confirm your password"),
}).refine((d) => d.next === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
})

type ProfileValues  = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "Dogukan",
      lastName:  "K.",
      email:     "dogukan7400@gmail.com",
      title:     "Administrator",
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  })

  function onProfileSubmit(values: ProfileValues) {
    console.log("Profile saved:", values)
    // TODO: call API
  }

  function onPasswordSubmit(values: PasswordValues) {
    console.log("Password changed:", values)
    passwordForm.reset()
    // TODO: call API
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* ── Profile section ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                DK
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Profile photo</p>
              <p className="text-xs text-muted-foreground">Avatar is generated from your initials</p>
            </div>
            <Badge variant="outline" className="ml-auto">Admin</Badge>
          </div>

          <Separator />

          {/* Profile form */}
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@university.edu" {...field} />
                    </FormControl>
                    <FormDescription>Used for login and notifications.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job title <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Course Administrator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" className="gap-2">
                  <Save className="h-3.5 w-3.5" />
                  Save profile
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── Notifications section ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Control what alerts you receive</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Session opened",       desc: "When an attendance session starts in your course" },
            { label: "Low attendance alert",  desc: "When a student drops below 70% attendance" },
            { label: "Weekly report",         desc: "Summary of attendance stats every Monday" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              {/* Simple toggle-style badge (visual only — no state in this demo) */}
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                Enabled
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Security section ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>Change your password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="current"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={passwordForm.control}
                  name="next"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" className="gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Update password
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
