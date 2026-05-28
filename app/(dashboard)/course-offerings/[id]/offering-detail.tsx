"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, CalendarCheck, CheckCircle2, Clock, Loader2, Plus,
  Pencil, QrCode, Scan, Trash2, Upload, UserCog, Users, Wifi, Nfc,
} from "lucide-react"
import { type CourseOffering, MOCK_COURSE_OFFERINGS } from "@/lib/mock/course-offerings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { BulkEnrollModal } from "@/components/enrollment/bulk-enroll-modal"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { useGetApiAttendancesMatrix } from "@/lib/api/attendances/attendances"
import { useGetApiCourseOfferingStaffs } from "@/lib/api/course-offering-staffs/course-offering-staffs"
import { useGetApiCourseOfferings } from "@/lib/api/course-offerings/course-offerings"
import {
  useDeleteApiEnrollmentsId,
  useGetApiEnrollments,
  usePostApiEnrollments,
  usePutApiEnrollmentsIdSection,
} from "@/lib/api/enrollments/enrollments"
import { useGetApiSections } from "@/lib/api/sections/sections"
import { useGetApiSessions } from "@/lib/api/sessions/sessions"
import { AttendanceMethod, AttendanceStatus } from "@/lib/api/model"
import type { EnrollmentDto, SessionDto } from "@/lib/api/model"
import {
  MOCK_MODULES, MOCK_OFFERINGS, MOCK_SECTIONS, MOCK_SESSIONS,
  makeMockEnrollments, makeMockMatrix,
} from "@/lib/mock-data"

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Scheduled: "secondary",
  Cancelled: "destructive",
}

const STATUS_STYLE: Record<string, string> = {
  [AttendanceStatus.Present]: "bg-primary/10 text-primary border-primary/20",
  [AttendanceStatus.Late]: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  [AttendanceStatus.Absent]: "bg-destructive/10 text-destructive border-destructive/20",
  [AttendanceStatus.Excused]: "bg-muted text-muted-foreground border-border",
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

function methodIcon(method: string) {
  if (method === AttendanceMethod.QrWifi) return <Wifi className="h-3.5 w-3.5" />
  if (method === AttendanceMethod.Nfc) return <Nfc className="h-3.5 w-3.5" />
  return <QrCode className="h-3.5 w-3.5" />
}

function methodLabel(method: string) {
  if (method === AttendanceMethod.QrWifi) return "QR + WiFi"
  if (method === AttendanceMethod.Nfc) return "NFC"
  if (method === AttendanceMethod.Manual) return "Manual"
  return "QR Code"
}

function calcDuration(openedAt: string, closedAt: string | null) {
  if (!closedAt) return "Ongoing"
  const mins = Math.round((new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function getMockSessionsForOffering(courseOfferingId: number | string) {
  const moduleIds = new Set((MOCK_MODULES[String(courseOfferingId)] ?? []).map((m) => String(m.id)))
  return MOCK_SESSIONS.filter((session) => moduleIds.has(String(session.moduleId)))
}

function getLegacyOfferingForStaffId(id: string) {
  const staffOffering = MOCK_OFFERINGS.find((o) => String(o.id) === id)
  if (!staffOffering) return null
  return MOCK_COURSE_OFFERINGS.find((o) => o.courseName === staffOffering.courseTitle) ?? null
}

function shortStatus(status: string) {
  if (status === AttendanceStatus.Present) return "P"
  if (status === AttendanceStatus.Late) return "L"
  if (status === AttendanceStatus.Absent) return "A"
  if (status === AttendanceStatus.Excused) return "E"
  return "-"
}

function ManualEnrollmentDialog({
  open,
  onOpenChange,
  sections,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: { id: number | string; name: string }[]
  onAdd: (student: { userId: string; userName: string; sectionId: number | string; sectionName: string }) => void
}) {
  const [userId, setUserId] = useState("")
  const [name, setName] = useState("")
  const [sectionId, setSectionId] = useState<string>("")
  const selectedSection = sections.find((section) => String(section.id) === sectionId) ?? sections[0]
  const canSave = userId.trim() && name.trim() && selectedSection

  function handleAdd() {
    if (!canSave || !selectedSection) return
    onAdd({
      userId: userId.trim(),
      userName: name.trim(),
      sectionId: selectedSection.id,
      sectionName: selectedSection.name,
    })
    setUserId("")
    setName("")
    setSectionId("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Student Manually</DialogTitle>
          <DialogDescription>
            Add one student to this course offering and assign the section they belong to.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student ID</Label>
            <Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="e.g. 20250042" />
          </div>
          <div className="space-y-2">
            <Label>Student Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <select
              value={sectionId || String(sections[0]?.id ?? "")}
              onChange={(event) => setSectionId(event.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              {sections.map((section) => (
                <option key={String(section.id)} value={String(section.id)}>{section.name}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!canSave}>Add Student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditEnrollmentDialog({
  open,
  onOpenChange,
  enrollment,
  sections,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollment: EnrollmentDto | null
  sections: { id: number | string; name: string }[]
  onSave: (student: { userId: number | string; userName: string; sectionId: number | string; sectionName: string }) => void
}) {
  const [userId, setUserId] = useState(() => String(enrollment?.userId ?? ""))
  const [name, setName] = useState(() => enrollment?.userName ?? "")
  const [sectionId, setSectionId] = useState<string>(() => String(enrollment?.sectionId ?? ""))

  const selectedSection = sections.find((section) => String(section.id) === sectionId)
    ?? sections.find((section) => String(section.id) === String(enrollment?.sectionId))
    ?? sections[0]
  const canSave = !!enrollment && userId.trim() && name.trim() && selectedSection

  function handleSave() {
    if (!canSave || !selectedSection) return
    onSave({
      userId: userId.trim(),
      userName: name.trim(),
      sectionId: selectedSection.id,
      sectionName: selectedSection.name,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update the enrolled student&apos;s visible info and section assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student ID</Label>
            <Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="e.g. 20250042" />
          </div>
          <div className="space-y-2">
            <Label>Student Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <select
              value={sectionId || String(sections[0]?.id ?? "")}
              onChange={(event) => setSectionId(event.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              {sections.map((section) => (
                <option key={String(section.id)} value={String(section.id)}>{section.name}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StaffOfferingDetail({ offeringId, legacyOffering }: { offeringId: string; legacyOffering?: CourseOffering | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const defaultTab = ["matrix", "staff", "students", "sessions"].includes(requestedTab ?? "")
    ? requestedTab ?? "matrix"
    : "matrix"
  const requestedSectionId = searchParams.get("sectionId")
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string>(requestedSectionId ?? "all")
  const [localEnrollments, setLocalEnrollments] = useState<EnrollmentDto[]>([])
  const [editedEnrollments, setEditedEnrollments] = useState<Record<string, Partial<EnrollmentDto>>>({})
  const [deletedEnrollmentIds, setDeletedEnrollmentIds] = useState<Set<string>>(() => new Set())
  const [editingEnrollment, setEditingEnrollment] = useState<EnrollmentDto | null>(null)

  const numericId = Number(offeringId)
  const mockMode = Number.isFinite(numericId) && numericId >= 9000

  const { data: apiOfferings = [], isLoading: loadingOfferings } = useGetApiCourseOfferings({
    query: { enabled: !mockMode },
  })
  const { data: apiMatrix, isLoading: loadingMatrix } = useGetApiAttendancesMatrix(
    { courseOfferingId: offeringId },
    { query: { enabled: !mockMode } },
  )
  const { data: apiStaff = [], isLoading: loadingStaff } = useGetApiCourseOfferingStaffs(
    { courseOfferingId: offeringId },
    { query: { enabled: !mockMode } },
  )
  const { data: apiSections = [], isLoading: loadingSections } = useGetApiSections(
    { courseOfferingId: offeringId },
    { query: { enabled: !mockMode } },
  )
  const { data: apiEnrollments = [], isLoading: loadingEnrollments } = useGetApiEnrollments(
    { courseOfferingId: offeringId },
    { query: { enabled: !mockMode } },
  )
  const { data: apiSessions = [], isLoading: loadingSessions } = useGetApiSessions(
    { courseOfferingId: offeringId },
    { query: { enabled: !mockMode } },
  )
  const { mutateAsync: enrollStudent } = usePostApiEnrollments()
  const { mutateAsync: deleteEnrollment } = useDeleteApiEnrollmentsId()
  const { mutateAsync: updateEnrollmentSection } = usePutApiEnrollmentsIdSection()

  const mockOffering = MOCK_OFFERINGS.find((offering) => String(offering.id) === offeringId)
  const apiOffering = apiOfferings.find((offering) => String(offering.id) === offeringId)
  const header = mockMode
    ? mockOffering
    : apiOffering
  const displayName = header?.courseTitle ?? legacyOffering?.courseName ?? "Course Offering"
  const displayCode = header?.courseCode ?? `Offering #${offeringId}`
  const displayTerm = header?.termCode ?? legacyOffering?.termName ?? "Current term"

  const sections = mockMode ? (MOCK_SECTIONS[offeringId] ?? []) : apiSections
  const matrix = mockMode ? makeMockMatrix(numericId) : apiMatrix
  const baseEnrollments = mockMode
    ? makeMockEnrollments(numericId, sections, 45)
    : apiEnrollments
  const enrollments = [...localEnrollments, ...baseEnrollments]
    .filter((enrollment) => !deletedEnrollmentIds.has(String(enrollment.id)))
    .map((enrollment) => ({
      ...enrollment,
      ...(editedEnrollments[String(enrollment.id)] ?? {}),
    }))
  const staff = mockMode
    ? (legacyOffering?.staff ?? getLegacyOfferingForStaffId(offeringId)?.staff ?? [])
    : apiStaff
  const sessions = mockMode ? getMockSessionsForOffering(offeringId) : apiSessions
  const selectedSection = activeSectionId === "all"
    ? null
    : sections.find((section) => String(section.id) === activeSectionId) ?? null
  const showSectionColumn = !selectedSection
  const sectionNameById = new Map(sections.map((section) => [String(section.id), section.name]))
  const filteredEnrollments = selectedSection
    ? enrollments.filter((student) => String(student.sectionId) === String(selectedSection.id))
    : enrollments
  const filteredMatrix = matrix
    ? {
        ...matrix,
        students: selectedSection
          ? matrix.students.filter((student) => String(student.currentSectionId) === String(selectedSection.id))
          : matrix.students,
      }
    : undefined
  const filteredSessions = selectedSection
    ? sessions.filter((session) => String(session.sectionId) === String(selectedSection.id))
    : sessions

  const matrixLoading = !mockMode && loadingMatrix
  const staffLoading = !mockMode && loadingStaff
  const enrollmentLoading = !mockMode && (loadingEnrollments || loadingSections)
  const sessionsLoading = !mockMode && loadingSessions
  const pageLoading = !mockMode && loadingOfferings && !apiOffering

  const totalPresent = filteredMatrix?.students.reduce((count, student) => (
    count + student.attendanceStatuses.filter((status) => status === AttendanceStatus.Present || status === AttendanceStatus.Late).length
  ), 0) ?? 0
  const totalCells = filteredMatrix ? filteredMatrix.students.length * filteredMatrix.modules.length : 0
  const attendanceRate = totalCells ? Math.round((totalPresent / totalCells) * 100) : 0

  async function handleManualAdd(student: { userId: string; userName: string; sectionId: number | string; sectionName: string }) {
    if (!mockMode) {
      await enrollStudent({
        data: {
          userId: student.userId,
          courseOfferingId: offeringId,
          sectionId: student.sectionId,
        },
      })
    }

    setLocalEnrollments((prev) => [
      {
        id: `local-${student.userId}`,
        userId: student.userId,
        userName: student.userName,
        courseOfferingId: offeringId,
        sectionId: student.sectionId,
        sectionName: student.sectionName,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  async function handleRemoveEnrollment(enrollment: EnrollmentDto) {
    if (String(enrollment.id).startsWith("local-")) {
      setLocalEnrollments((prev) => prev.filter((item) => String(item.id) !== String(enrollment.id)))
      setEditedEnrollments((prev) => {
        const next = { ...prev }
        delete next[String(enrollment.id)]
        return next
      })
      return
    }

    if (!mockMode) {
      await deleteEnrollment({ id: enrollment.id })
    }

    setDeletedEnrollmentIds((prev) => new Set(prev).add(String(enrollment.id)))
    setEditedEnrollments((prev) => {
      const next = { ...prev }
      delete next[String(enrollment.id)]
      return next
    })
  }

  async function handleEditEnrollment(student: {
    userId: number | string
    userName: string
    sectionId: number | string
    sectionName: string
  }) {
    if (!editingEnrollment) return

    const patch: Partial<EnrollmentDto> = {
      userId: student.userId,
      userName: student.userName,
      sectionId: student.sectionId,
      sectionName: student.sectionName,
    }

    if (String(editingEnrollment.id).startsWith("local-")) {
      setLocalEnrollments((prev) => prev.map((item) => (
        String(item.id) === String(editingEnrollment.id) ? { ...item, ...patch } : item
      )))
    } else {
      if (!mockMode) {
        await updateEnrollmentSection({
          id: editingEnrollment.id,
          data: { id: editingEnrollment.id, sectionId: student.sectionId },
        })
      }

      setEditedEnrollments((prev) => ({
        ...prev,
        [String(editingEnrollment.id)]: patch,
      }))
    }

    setEditingEnrollment(null)
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/my-courses">My Courses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{displayCode}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">{displayCode}</Badge>
                <Badge variant="outline">{displayTerm}</Badge>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">{displayName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Staff course workspace with attendance, enrollment and session controls.
              </p>
            </div>
            <Button onClick={() => router.push("/attendance")} className="gap-2 self-start">
              <Scan className="h-4 w-4" />Start Session
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Students", value: filteredEnrollments.length, icon: Users },
              { label: "Staff", value: staff.length, icon: UserCog },
              { label: "Sessions", value: filteredSessions.length, icon: CalendarCheck },
              { label: "Attendance", value: `${attendanceRate}%`, icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                  {item.label}
                </div>
                <p className="mt-1 text-xl font-bold tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {sections.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Section</span>
          <button
            type="button"
            onClick={() => setActiveSectionId("all")}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              activeSectionId === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            All Sections
          </button>
          {sections.map((section) => (
            <button
              key={String(section.id)}
              type="button"
              onClick={() => setActiveSectionId(String(section.id))}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                activeSectionId === String(section.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              {section.name}
            </button>
          ))}
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="matrix">Attendance Matrix</TabsTrigger>
          <TabsTrigger value="staff">Assigned Staff</TabsTrigger>
          <TabsTrigger value="students">Enrollment Students</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              {matrixLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !filteredMatrix || filteredMatrix.modules.length === 0 || filteredMatrix.students.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No attendance data yet.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-48">Student</TableHead>
                        {showSectionColumn && <TableHead>Section</TableHead>}
                        {filteredMatrix.modules.map((module, index) => (
                          <TableHead key={String(module.moduleId)} className="text-center" title={module.title}>
                            W{index + 1}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMatrix.students.map((student) => (
                        <TableRow key={String(student.studentId)}>
                          <TableCell className="font-medium">{student.studentName}</TableCell>
                          {showSectionColumn && <TableCell>{student.currentSectionName}</TableCell>}
                          {student.attendanceStatuses.map((status, index) => (
                            <TableCell key={`${student.studentId}-${index}`} className="text-center">
                              <span className={cn(
                                "inline-flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold",
                                STATUS_STYLE[status] ?? "bg-muted text-muted-foreground",
                              )}>
                                {shortStatus(status)}
                              </span>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : staff.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No staff assigned.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {staff.map((person) => (
                    <div key={String(person.id)} className="rounded-lg border p-3">
                      <p className="font-medium">{"userName" in person ? person.userName : person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {"roleTitle" in person ? (person.roleTitle ?? "Staff") : person.role}
                      </p>
                      {"email" in person && <p className="mt-1 text-xs text-muted-foreground">{person.email}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Enrollment Students</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setManualOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />Add Student
                  </Button>
                  <Button size="sm" onClick={() => setBulkEnrollOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />Import from Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {enrollmentLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEnrollments.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No enrolled students.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student ID</TableHead>
                        {showSectionColumn && <TableHead>Section</TableHead>}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnrollments.map((student) => (
                        <TableRow key={String(student.id)}>
                          <TableCell className="font-medium">{student.userName}</TableCell>
                          <TableCell className="font-mono text-xs">{student.userId}</TableCell>
                          {showSectionColumn && <TableCell>{student.sectionName}</TableCell>}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                onClick={() => setEditingEnrollment(student)}
                                aria-label={`Edit ${student.userName}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRemoveEnrollment(student)}
                                aria-label={`Remove ${student.userName}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No sessions yet.</p>
              ) : (
                filteredSessions.map((session: SessionDto) => {
                  const isOpen = session.status === "Open"
                  const sessionSectionName = session.sectionName ?? (
                    session.sectionId ? sectionNameById.get(String(session.sectionId)) : null
                  )
                  return (
                    <button
                      key={String(session.id)}
                      type="button"
                      onClick={() => router.push(`/sessions/${encodeURIComponent(String(session.id))}`)}
                      className="w-full rounded-lg border p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {methodIcon(session.selectedMethod)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{session.moduleTitle}</p>
                            {sessionSectionName && <span className="text-sm text-muted-foreground">{sessionSectionName}</span>}
                            <Badge variant={isOpen ? "default" : "secondary"}>{isOpen ? "Open" : session.status}</Badge>
                            <Badge variant="outline" className="gap-1.5">{methodIcon(session.selectedMethod)}{methodLabel(session.selectedMethod)}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarCheck className="h-3.5 w-3.5" />{fmtDate(session.openedAt)} · {fmtTime(session.openedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />{calcDuration(session.openedAt, session.closedAt)}
                            </span>
                            <span>By {session.openedByUserName}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BulkEnrollModal
        open={bulkEnrollOpen}
        onOpenChange={setBulkEnrollOpen}
        courseOfferingId={offeringId}
      />
      <ManualEnrollmentDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        sections={sections}
        onAdd={handleManualAdd}
      />
      <EditEnrollmentDialog
        key={String(editingEnrollment?.id ?? "no-editing-enrollment")}
        open={!!editingEnrollment}
        onOpenChange={(open) => {
          if (!open) setEditingEnrollment(null)
        }}
        enrollment={editingEnrollment}
        sections={sections}
        onSave={handleEditEnrollment}
      />
    </div>
  )
}

function AdminOfferingDetail({ offering }: { offering?: CourseOffering | null }) {
  const router = useRouter()
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false)

  if (!offering) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <p className="text-muted-foreground">Course offering not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/course-offerings">Course Offerings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{offering.courseName} - {offering.section}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>{offering.courseName}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Term</p>
            <p className="font-medium">{offering.termName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Section</p>
            <p className="font-medium">{offering.section}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Enrolled</p>
            <p className="font-medium">{offering.students.length} students</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="students">
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="students">
              <Users className="mr-2 h-4 w-4" />
              Enrolled Students ({offering.students.length})
            </TabsTrigger>
            <TabsTrigger value="staff">
              <UserCog className="mr-2 h-4 w-4" />
              Staff ({offering.staff.length})
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Sessions ({offering.sessions.length})
            </TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setBulkEnrollOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import from Excel
          </Button>
        </div>

        <TabsContent value="students" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offering.students.length ? (
                  offering.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-20 text-center text-muted-foreground">
                      No enrolled students.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offering.staff.length ? (
                  offering.staff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>{staff.role}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                      No staff assigned.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offering.sessions.length ? (
                  offering.sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.date}</TableCell>
                      <TableCell className="font-medium">{session.topic}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[session.status] ?? "secondary"}>
                          {session.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                      No sessions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <BulkEnrollModal
        open={bulkEnrollOpen}
        onOpenChange={setBulkEnrollOpen}
        courseOfferingId={offering.id}
      />
    </div>
  )
}

export function OfferingDetail({ offering, offeringId }: { offering?: CourseOffering | null; offeringId: string }) {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const legacyOffering = useMemo(() => offering ?? getLegacyOfferingForStaffId(offeringId), [offering, offeringId])
  const isStaff = user?.roles.includes("Staff") ?? false
  const cameFromMyCourses = searchParams.get("from") === "my-courses"

  if (isStaff || cameFromMyCourses) {
    return <StaffOfferingDetail offeringId={offeringId} legacyOffering={legacyOffering} />
  }

  return <AdminOfferingDetail offering={offering} />
}
