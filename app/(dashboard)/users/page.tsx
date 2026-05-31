"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Search, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  UpdateUserRolesCommand,
  UserDto,
  UserRole,
} from "@/lib/api/model";
import { UserRole as UserRoleValues } from "@/lib/api/model";
import {
  getGetApiUsersQueryKey,
  useGetApiUsers,
  usePutApiUsersIdRoles,
} from "@/lib/api/users/users";

const ROLE_FILTERS = ["All", UserRoleValues.Admin, UserRoleValues.Staff, UserRoleValues.Student] as const;
const ROLE_OPTIONS = [UserRoleValues.Admin, UserRoleValues.Staff, UserRoleValues.Student] as const;

function isUserRole(value: string): value is UserRole {
  return ROLE_OPTIONS.some((role) => role === value);
}

function getRoles(user: UserDto): UserRole[] {
  const roles = user.roles.filter(isUserRole);
  if (roles.length > 0) return roles;
  return isUserRole(user.role) ? [user.role] : [];
}

function roleBadgeClass(role: UserRole) {
  if (role === UserRoleValues.Admin) return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
  if (role === UserRoleValues.Staff) return "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString() : "";
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState<(typeof ROLE_FILTERS)[number]>("All");
  const [updatingId, setUpdatingId] = useState<UserDto["id"] | null>(null);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);

  const usersQuery = useGetApiUsers();
  const updateRoles = usePutApiUsersIdRoles({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetApiUsersQueryKey() }),
      onSettled: () => setUpdatingId(null),
    },
  });

  const users = usersQuery.data ?? [];
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const roles = getRoles(user);
      const matchesRole = activeRole === "All" || roles.includes(activeRole);
      const matchesSearch =
        term.length === 0 ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.studentNumber ?? "").toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [activeRole, search, users]);

  function countByRole(role: UserRole) {
    return users.filter((user) => getRoles(user).includes(role)).length;
  }

  function openRoleDialog(user: UserDto) {
    setEditingUser(user);
    setSelectedRoles(getRoles(user));
  }

  function toggleSelectedRole(role: UserRole, checked: boolean) {
    setSelectedRoles((currentRoles) => {
      if (checked) return Array.from(new Set([...currentRoles, role]));
      return currentRoles.filter((currentRole) => currentRole !== role);
    });
  }

  function saveRoles() {
    if (!editingUser || selectedRoles.length === 0) return;
    const data: UpdateUserRolesCommand = {
      id: editingUser.id,
      roles: selectedRoles,
    };
    setUpdatingId(editingUser.id);
    updateRoles.mutate(
      { id: editingUser.id, data },
      { onSuccess: () => setEditingUser(null) },
    );
  }

  const isLoading = usersQuery.isLoading;
  const hasError = usersQuery.error || updateRoles.error;

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 ? "s" : ""} across admin, staff, and student roles
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Multi-role assignment
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {ROLE_OPTIONS.map((role) => (
          <Card key={role}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{role}</p>
                <p className="text-xs text-muted-foreground">Assigned users</p>
              </div>
              <span className="text-2xl font-semibold">{countByRole(role)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((role) => {
            const selected = activeRole === role;
            const count = role === "All" ? users.length : countByRole(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {role}
                <span className={selected ? "text-primary-foreground/80" : "text-muted-foreground"}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {hasError ? (
        <p className="text-sm text-destructive">Something went wrong while syncing users. Please try again.</p>
      ) : null}

      {isLoading ? (
        <div className="py-24 text-center text-sm text-muted-foreground">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No users found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search or role tab.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="w-20 text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const roles = getRoles(user);
                const isUpdating = String(updatingId) === String(user.id) && updateRoles.isPending;
                return (
                  <TableRow key={String(user.id)}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.studentNumber ? (
                          <p className="text-xs text-muted-foreground">Student #{user.studentNumber}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {roles.map((role) => (
                          <Badge key={role} variant="outline" className={roleBadgeClass(role)}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        disabled={isUpdating}
                        onClick={() => openRoleDialog(user)}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pencil className="h-3.5 w-3.5" />
                        )}
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Roles</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <p className="font-medium">{editingUser?.name}</p>
              <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
            </div>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((role) => {
                const checked = selectedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className="flex items-center justify-between rounded-md border bg-background px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium">{role}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={checked && selectedRoles.length === 1}
                      onChange={(event) => toggleSelectedRole(role, event.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </label>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={saveRoles} disabled={updateRoles.isPending || selectedRoles.length === 0}>
              {updateRoles.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
