"use client"

import { useState } from "react"
import { User, Bell, Shield, UserPlus, CheckCircle2, Loader2, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { usePostApiAuthRegister } from "@/lib/api/auth/auth"
import { useGetApiUsers } from "@/lib/api/users/users"
import { UserRole } from "@/lib/api/model"
import { customInstance } from "@/lib/axios-instance"

// ── Add-role API call (no generated hook yet) ─────────────────────────────────

async function addRoleRequest(email: string, role: UserRole) {
  await customInstance<void>({
    url: "/api/Auth/add-role",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: { email, role },
  })
}

// ── Role Status Badge ─────────────────────────────────────────────────────────

function RoleBadge({
  label,
  active,
  loading,
  onAdd,
}: {
  label: string
  active: boolean
  loading?: boolean
  onAdd?: () => void
}) {
  if (active) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">{label}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-dashed">
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      {onAdd && (
        <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={onAdd} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-0.5" />Add</>}
        </Button>
      )}
    </div>
  )
}

// ── Sync Account Card ─────────────────────────────────────────────────────────

function SyncAccountCard() {
  const { user } = useAuth()
  const { data: allUsers, refetch } = useGetApiUsers()

  // Register form state
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>(UserRole.Staff)
  const [registerError, setRegisterError] = useState<string | null>(null)

  // Add-role state
  const [addingRole, setAddingRole] = useState<UserRole | null>(null)
  const [addRoleError, setAddRoleError] = useState<string | null>(null)
  // Track locally-added roles (persists until page refresh)
  const [localRoles, setLocalRoles] = useState<UserRole[]>([])

  const register = usePostApiAuthRegister({
    mutation: {
      onSuccess: () => {
        setPassword("")
        setRegisterError(null)
        refetch()
      },
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { errors?: string[] } } })
            ?.response?.data?.errors?.[0] ?? "Registration failed."
        setRegisterError(msg)
      },
    },
  })

  const dbUser = allUsers?.find(
    (u) => u.email.toLowerCase() === user?.email?.toLowerCase()
  )

  const isRegistered = !!dbUser

  // Determine which roles are active
  const primaryRole = dbUser?.role as UserRole | undefined
  const hasAdmin =
    primaryRole === UserRole.Admin || localRoles.includes(UserRole.Admin)
  const hasStaff =
    primaryRole === UserRole.Staff || localRoles.includes(UserRole.Staff)

  async function handleAddRole(roleToAdd: UserRole) {
    if (!user?.email) return
    setAddingRole(roleToAdd)
    setAddRoleError(null)
    try {
      await addRoleRequest(user.email, roleToAdd)
      setLocalRoles((prev) => [...prev, roleToAdd])
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { errors?: string[] } } })
          ?.response?.data?.errors?.[0] ?? "Failed to add role."
      setAddRoleError(msg)
    } finally {
      setAddingRole(null)
    }
  }

  function handleRegister() {
    if (!user?.email || !user?.displayName || !password) return
    setRegisterError(null)
    register.mutate({ data: { name: user.displayName, email: user.email, password, role } })
  }

  // ── Already registered ────────────────────────────────────────────────────
  if (isRegistered) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base">System Account</CardTitle>
              <CardDescription>Manage your roles in the database</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User info */}
          <div className="grid grid-cols-2 gap-3 text-sm p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-muted-foreground text-xs">Name</p>
              <p className="font-medium">{dbUser?.name ?? user?.displayName ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p className="font-medium">{dbUser?.email ?? "—"}</p>
            </div>
          </div>

          {/* Role badges */}
          <div>
            <p className="text-sm font-medium mb-2">Assigned Roles</p>
            <div className="space-y-2">
              <RoleBadge
                label="Admin"
                active={hasAdmin}
                loading={addingRole === UserRole.Admin}
                onAdd={hasAdmin ? undefined : () => handleAddRole(UserRole.Admin)}
              />
              <RoleBadge
                label="Staff (Professor / Assistant)"
                active={hasStaff}
                loading={addingRole === UserRole.Staff}
                onAdd={hasStaff ? undefined : () => handleAddRole(UserRole.Staff)}
              />
            </div>
          </div>

          {addRoleError && (
            <p className="text-sm text-destructive">{addRoleError}</p>
          )}

          <p className="text-xs text-muted-foreground">
            You can hold multiple roles. Adding a role takes effect immediately.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── Not registered yet ────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserPlus className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Sync Account to System</CardTitle>
            <CardDescription>
              Register your Azure AD account in the database to be assigned to courses
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Azure AD info */}
        <div className="grid grid-cols-2 gap-3 text-sm p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-muted-foreground text-xs">Name</p>
            <p className="font-medium">{user?.displayName ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-medium">{user?.email ?? "—"}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sync-role">Initial Role</Label>
          <select
            id="sync-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value={UserRole.Staff}>Staff (Professor / Assistant)</option>
            <option value={UserRole.Admin}>Admin</option>
          </select>
          <p className="text-xs text-muted-foreground">
            You can add additional roles after registering.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sync-password">
            Set a password <span className="text-muted-foreground text-xs">(min 6 chars)</span>
          </Label>
          <Input
            id="sync-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Only for the local DB record — you still log in with Azure AD.
          </p>
        </div>

        {registerError && (
          <p className="text-sm text-destructive">{registerError}</p>
        )}

        <Button
          onClick={handleRegister}
          disabled={!password || password.length < 6 || register.isPending}
          className="w-full"
        >
          {register.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering…</>
          ) : (
            <><UserPlus className="mr-2 h-4 w-4" />Register in System</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* ── Profile info (read-only from Azure AD) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Your Microsoft account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{user?.displayName ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? "—"}</p>
            </div>
            <Badge variant="outline">Azure AD</Badge>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Profile information is managed by your Microsoft account and cannot be changed here.
          </p>
        </CardContent>
      </Card>

      {/* ── Sync / role management card ── */}
      <SyncAccountCard />

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
            { label: "Low attendance alert", desc: "When a student drops below 70% attendance" },
            { label: "Weekly report",        desc: "Summary of attendance stats every Monday" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Badge variant="outline" className="text-xs">Enabled</Badge>
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
              <CardDescription>Your sign-in is managed by Microsoft Azure AD</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Password and two-factor authentication are controlled through your{" "}
            <a
              href="https://myaccount.microsoft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Microsoft account
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
