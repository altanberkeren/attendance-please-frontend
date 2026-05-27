"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  Users, UserCog, CalendarCheck, Upload, Loader2,
  Plus, Trash2, Square, Ban, CheckCircle2, Clock,
  BookOpen, LayoutGrid,
} from "lucide-react"
import { useGetApiCourseOfferingsId } from "@/lib/api/course-offerings/course-offerings"
import { useGetApiCourseOfferingStaffs, usePostApiCourseOfferingStaffs, useDeleteApiCourseOfferingStaffsId } from "@/lib/api/course-offering-staffs/course-offering-staffs"
import { useGetApiModules } from "@/lib/api/modules/modules"
import { useGetApiSections, usePostApiSections } from "@/lib/api/sections/sections"
import { useGetApiEnrollments } from "@/lib/api/enrollments/enrollments"
import { useGetApiSessions, usePostApiSessions, usePostApiSessionsIdClose, usePostApiSessionsIdCancel } from "@/lib/api/sessions/sessions"
import { useGetApiUsers } from "@/lib/api/users/users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { BulkEnrollModal } from "@/components/enrollment/bulk-enroll-modal"
import { useRoleSimulator } from "@/hooks/use-role-simulator"
import { useCurrentUser } from "@/hooks/use-current-user"
import { AttendanceMethod, SessionStatus } from "@/lib/api/model"

// ── helpers ───────────────────────────────────────────────────────────────────

function sessionStatusBadge(status: string) {
  if (status === SessionStatus.Open)
    return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Open</Badge>
  if (status === SessionStatus.Canceled)
    return <Badge variant="destructive">Canceled</Badge>
  return <Badge variant="secondary">Closed</Badge>
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

// ── Add Section Dialog ────────────────────────────────────────────────────────

function AddSectionDialog({ open, onOpenChange, offeringId }: { open: boolean; onOpenChange: (v: boolean) => void; offeringId: string }) {
  const [name, setName] = useState("")
  const qc = useQueryClient()

  const create = usePostApiSections({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`/api/Sections`] })
        setName("")
        onOpenChange(false)
      },
    },
  })

  function handleSubmit() {
    if (!name.trim()) return
    create.mutate({ data: { courseOfferingId: offeringId, name: name.trim() } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Section</DialogTitle></DialogHeader>
        <div className="py-2">
          <Label htmlFor="sec-name">Section Name <span className="text-destructive">*</span></Label>
          <Input
            id="sec-name"
            className="mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Section A, Group 1…"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Open Session Dialog ───────────────────────────────────────────────────────

interface OpenSessionDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  offeringId: string
}

function OpenSessionDialog({ open, onOpenChange, offeringId }: OpenSessionDialogProps) {
  const { currentUser } = useCurrentUser()
  const { data: modules } = useGetApiModules({ courseOfferingId: offeringId })
  const { data: sections } = useGetApiSections({ courseOfferingId: offeringId })
  const qc = useQueryClient()

  const [moduleId, setModuleId] = useState("")
  const [sectionId, setSectionId] = useState("all")
  const [method, setMethod] = useState<string>(AttendanceMethod.Manual)

  const openSession = usePostApiSessions({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`/api/Sessions`] })
        onOpenChange(false)
        setModuleId("")
        setSectionId("all")
        setMethod(AttendanceMethod.Manual)
      },
    },
  })

  function handleSubmit() {
    if (!moduleId || !currentUser) return
    openSession.mutate({
      data: {
        moduleId,
        sectionId: sectionId === "all" ? null : sectionId,
        selectedMethod: method as AttendanceMethod,
        openedByUserId: currentUser.id,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Open Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Module <span className="text-destructive">*</span></Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a module" />
              </SelectTrigger>
              <SelectContent position="popper">
                {(modules ?? []).map((m) => (
                  <SelectItem key={String(m.id)} value={String(m.id)}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Section</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All sections</SelectItem>
                {(sections ?? []).map((s) => (
                  <SelectItem key={String(s.id)} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Attendance Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {Object.values(AttendanceMethod).map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!moduleId || openSession.isPending}
          >
            {openSession.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Open Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Assign Staff Dialog ───────────────────────────────────────────────────────

interface AssignStaffDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  offeringId: string
}

function AssignStaffDialog({ open, onOpenChange, offeringId }: AssignStaffDialogProps) {
  const { data: users, isLoading: loadingUsers } = useGetApiUsers()
  const qc = useQueryClient()
  const [userId, setUserId] = useState("")
  const [roleTitle, setRoleTitle] = useState("")

  const assign = usePostApiCourseOfferingStaffs({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`/api/CourseOfferingStaffs`] })
        onOpenChange(false)
        setUserId("")
        setRoleTitle("")
        setApiError(null)
      },
      onError: (err: unknown) => {
        const e = err as { response?: { data?: { title?: string; errors?: unknown } }; message?: string }
        const msg = e?.response?.data?.title ?? e?.message ?? "Unknown error"
        setApiError(msg)
        console.error("Assign staff error:", e?.response?.data ?? err)
      },
    },
  })

  const [apiError, setApiError] = useState<string | null>(null)

  function handleSubmit() {
    if (!userId) return
    setApiError(null)
    console.log("Assigning staff:", { courseOfferingId: offeringId, userId, roleTitle })
    assign.mutate({
      data: {
        courseOfferingId: offeringId,
        userId,
        roleTitle: roleTitle || null,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Staff</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="assign-user">
              User <span className="text-destructive">*</span>
              {!loadingUsers && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({(users ?? []).length} users)
                </span>
              )}
            </Label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading users…
              </div>
            ) : (
              <select
                id="assign-user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">— Select a user —</option>
                {(users ?? []).map((u) => (
                  <option key={String(u.id)} value={String(u.id)}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            )}
            {!loadingUsers && (users ?? []).length === 0 && (
              <p className="text-xs text-destructive">
                No users found in the database.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assign-role">
              Role Title <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="assign-role"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Teaching Assistant"
            />
          </div>
        </div>
        {apiError && (
          <p className="text-sm text-destructive px-1">{apiError}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!userId || assign.isPending}>
            {assign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function OfferingDetail({ id }: { id: string }) {
  const router = useRouter()
  const { isStaffView } = useRoleSimulator()
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false)
  const [openSessionOpen, setOpenSessionOpen] = useState(false)
  const [assignStaffOpen, setAssignStaffOpen] = useState(false)
  const [addSectionOpen, setAddSectionOpen] = useState(false)

  const qc = useQueryClient()

  const { data: offering, isLoading: loadingOffering } = useGetApiCourseOfferingsId(id)
  const { data: staffList } = useGetApiCourseOfferingStaffs({ courseOfferingId: id })
  const { data: enrollments } = useGetApiEnrollments({ courseOfferingId: id })
  const { data: sessions } = useGetApiSessions({ courseOfferingId: id })
  const { data: modules } = useGetApiModules({ courseOfferingId: id })
  const { data: sections } = useGetApiSections({ courseOfferingId: id })

  const closeSession = usePostApiSessionsIdClose({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/Sessions`] }),
    },
  })
  const cancelSession = usePostApiSessionsIdCancel({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/Sessions`] }),
    },
  })
  const removeStaff = useDeleteApiCourseOfferingStaffsId({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/CourseOfferingStaffs`] }),
    },
  })

  const sortedSessions = [...(sessions ?? [])].sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  )

  if (loadingOffering) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!offering) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:underline">
          ← Back
        </button>
        <p className="text-muted-foreground">Course offering not found.</p>
      </div>
    )
  }

  // Which tabs to show
  const defaultTab = isStaffView ? "students" : "modules"

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ── */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/course-offerings">
              {isStaffView ? "My Courses" : "Course Offerings"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{offering.courseTitle} — {offering.courseCode}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Header card ── */}
      <Card>
        <CardHeader>
          <CardTitle>{offering.courseTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Course Code</p>
            <p className="font-medium">{offering.courseCode}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Term</p>
            <p className="font-medium">{offering.termCode}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Staff</p>
            <p className="font-medium">{staffList?.length ?? 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Enrolled</p>
            <p className="font-medium">{enrollments?.length ?? 0} students</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className={isStaffView ? "" : "grid grid-cols-5 w-full sm:w-auto"}>
          {!isStaffView && (
            <>
              <TabsTrigger value="modules">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                Modules ({modules?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="sections">
                <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
                Sections ({sections?.length ?? 0})
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="students">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Students ({enrollments?.length ?? 0})
          </TabsTrigger>
          {!isStaffView && (
            <TabsTrigger value="staff">
              <UserCog className="mr-1.5 h-3.5 w-3.5" />
              Staff ({staffList?.length ?? 0})
            </TabsTrigger>
          )}
          <TabsTrigger value="sessions">
            <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
            Sessions ({sessions?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* ── Modules tab (admin only) ── */}
        {!isStaffView && (
          <TabsContent value="modules" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(modules ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                        No modules yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...(modules ?? [])].sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex)).map((m) => (
                      <TableRow key={String(m.id)}>
                        <TableCell className="text-muted-foreground">{String(m.orderIndex)}</TableCell>
                        <TableCell className="font-medium">{m.title}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{fmt(m.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}

        {/* ── Sections tab (admin only) ── */}
        {!isStaffView && (
          <TabsContent value="sections" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => setAddSectionOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Section
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sections ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-20 text-center text-muted-foreground">
                        No sections yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (sections ?? []).map((s) => (
                      <TableRow key={String(s.id)}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{fmt(s.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}

        {/* ── Students tab ── */}
        <TabsContent value="students" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" variant="outline" onClick={() => setBulkEnrollOpen(true)}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import from Excel
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Section</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(enrollments ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                      No enrolled students.
                    </TableCell>
                  </TableRow>
                ) : (
                  (enrollments ?? []).map((e) => (
                    <TableRow key={String(e.id)}>
                      <TableCell className="font-medium">{e.userName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{String(e.userId)}</TableCell>
                      <TableCell>{e.sectionName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Staff tab (admin only) ── */}
        {!isStaffView && (
          <TabsContent value="staff" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => setAssignStaffOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Assign Staff
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(staffList ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                        No staff assigned.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (staffList ?? []).map((s) => (
                      <TableRow key={String(s.id)}>
                        <TableCell className="font-medium">{s.userName}</TableCell>
                        <TableCell>{s.roleTitle ?? <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{fmt(s.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeStaff.mutate({ id: s.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}

        {/* ── Sessions tab ── */}
        <TabsContent value="sessions" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setOpenSessionOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Open Session
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                      No sessions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSessions.map((s) => (
                    <TableRow key={String(s.id)}>
                      <TableCell className="font-medium">{s.moduleTitle}</TableCell>
                      <TableCell>{s.sectionName ?? <span className="text-muted-foreground">All</span>}</TableCell>
                      <TableCell>{s.selectedMethod}</TableCell>
                      <TableCell>{sessionStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(s.openedAt)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.openedByUserName}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {s.status === SessionStatus.Open && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => closeSession.mutate({ id: s.id })}
                                disabled={closeSession.isPending}
                              >
                                <Square className="h-3 w-3" />
                                Close
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 text-destructive hover:text-destructive border-destructive/30"
                                onClick={() => cancelSession.mutate({ id: s.id })}
                                disabled={cancelSession.isPending}
                              >
                                <Ban className="h-3 w-3" />
                                Cancel
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => router.push(`/sessions/${s.id}`)}
                          >
                            <Users className="h-3 w-3" />
                            Attendance
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      <BulkEnrollModal
        open={bulkEnrollOpen}
        onOpenChange={setBulkEnrollOpen}
        courseOfferingId={id}
      />
      <OpenSessionDialog
        open={openSessionOpen}
        onOpenChange={setOpenSessionOpen}
        offeringId={id}
      />
      {!isStaffView && (
        <AssignStaffDialog
          open={assignStaffOpen}
          onOpenChange={setAssignStaffOpen}
          offeringId={id}
        />
      )}
      {!isStaffView && (
        <AddSectionDialog
          open={addSectionOpen}
          onOpenChange={setAddSectionOpen}
          offeringId={id}
        />
      )}
    </div>
  )
}
