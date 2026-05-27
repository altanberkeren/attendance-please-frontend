"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Layers, Plus, Trash2, CalendarCheck, ChevronRight, Loader2,
} from "lucide-react"
import { useGetApiCourseOfferings, usePostApiCourseOfferings, useDeleteApiCourseOfferingsId } from "@/lib/api/course-offerings/course-offerings"
import { useGetApiCourses } from "@/lib/api/courses/courses"
import { useGetApiTerms } from "@/lib/api/terms/terms"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { useRoleSimulator } from "@/hooks/use-role-simulator"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { CourseOfferingDto } from "@/lib/api/model"

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item)
    return acc
  }, {})
}

// ── Create Offering Dialog ────────────────────────────────────────────────────

interface CreateOfferingDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

function CreateOfferingDialog({ open, onOpenChange }: CreateOfferingDialogProps) {
  const qc = useQueryClient()
  const { data: courses } = useGetApiCourses()
  const { data: terms }   = useGetApiTerms()
  const [courseId, setCourseId] = useState("")
  const [termId, setTermId]     = useState("")
  const [note, setNote]         = useState("")

  const handleOpen = (v: boolean) => {
    if (v) { setCourseId(""); setTermId(""); setNote("") }
    onOpenChange(v)
  }

  const create = usePostApiCourseOfferings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/CourseOfferings"] })
        onOpenChange(false)
      },
    },
  })

  function handleSubmit() {
    if (!courseId || !termId) return
    create.mutate({ data: { courseId, termId, note: note || null } })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>New Course Offering</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Course <span className="text-destructive">*</span></Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent position="popper">
                {(courses ?? []).map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {c.code} — {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Term <span className="text-destructive">*</span></Label>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a term" />
              </SelectTrigger>
              <SelectContent position="popper">
                {(terms ?? []).map((t) => (
                  <SelectItem key={String(t.id)} value={String(t.id)}>
                    {t.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Note <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any notes…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!courseId || !termId || create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Staff View ────────────────────────────────────────────────────────────────

function StaffView() {
  const router = useRouter()
  const { currentUser, isLoading: userLoading } = useCurrentUser()
  const staffUserId = currentUser?.id
  const { data: offerings, isLoading } = useGetApiCourseOfferings(
    staffUserId ? { staffUserId } : undefined,
    { query: { enabled: !!staffUserId } }
  )

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-screen-xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
        <p className="text-sm text-muted-foreground">
          {offerings?.length ?? 0} course{(offerings?.length ?? 0) !== 1 ? "s" : ""} assigned to you
        </p>
      </div>

      {(!offerings || offerings.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No courses assigned to you yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ask an administrator to assign you to a course offering.
          </p>
        </div>
      )}

      {offerings && offerings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {offerings.map((offering) => (
            <Card
              key={String(offering.id)}
              className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/course-offerings/${offering.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-primary/10 text-primary">
                    {offering.termCode}
                  </span>
                  <span className="text-xs text-muted-foreground">{offering.courseCode}</span>
                </div>
                <p className="font-semibold text-sm leading-snug mb-3 line-clamp-2">{offering.courseTitle}</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button variant="default" size="sm" className="flex-1 h-7 text-xs gap-1.5">
                    <ChevronRight className="h-3 w-3" />View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Admin View ────────────────────────────────────────────────────────────────

function AdminView() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: offerings, isLoading } = useGetApiCourseOfferings()
  const deleteOffering = useDeleteApiCourseOfferingsId({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/CourseOfferings"] }) },
  })

  const [dialogOpen, setDialog] = useState(false)

  const grouped = groupBy(offerings ?? [], (o) => o.termCode)
  const termOrder = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-screen-xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Course Offerings</h1>
          <p className="text-sm text-muted-foreground">
            {(offerings ?? []).length} offering{(offerings ?? []).length !== 1 ? "s" : ""} across {termOrder.length} term{termOrder.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialog(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Offering
        </Button>
      </div>

      {/* Empty state */}
      {(offerings ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No offerings yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Offering" to create your first one.</p>
        </div>
      )}

      {/* Grouped by term */}
      {termOrder.map((term) => (
        <div key={term} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">{term}</h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              {grouped[term].length} offering{grouped[term].length !== 1 ? "s" : ""}
            </Badge>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped[term].map((offering: CourseOfferingDto) => (
              <Card
                key={String(offering.id)}
                className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-primary/10 text-primary">
                      {offering.courseCode}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/course-offerings/${offering.id}`)}>
                          <ChevronRight className="mr-2 h-3.5 w-3.5" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteOffering.mutate({ id: offering.id })}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{offering.courseTitle}</p>
                  {offering.note && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{offering.note}</p>
                  )}

                  <div className="flex gap-2 mt-3 pt-3 border-t opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="default" size="sm"
                      className="flex-1 h-7 text-xs gap-1.5"
                      onClick={() => router.push(`/course-offerings/${offering.id}`)}
                    >
                      <ChevronRight className="h-3 w-3" />Details
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => deleteOffering.mutate({ id: offering.id })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <CreateOfferingDialog open={dialogOpen} onOpenChange={setDialog} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CourseOfferingsPage() {
  const { isStaffView } = useRoleSimulator()
  return isStaffView ? <StaffView /> : <AdminView />
}
