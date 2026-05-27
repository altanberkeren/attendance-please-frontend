"use client"

import { useState } from "react"
import { BookOpen, Plus, Search, Pencil, Trash2, MoreHorizontal, Loader2 } from "lucide-react"
import { useGetApiCourses, usePostApiCourses, usePutApiCoursesId, useDeleteApiCoursesId } from "@/lib/api/courses/courses"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CourseDto } from "@/lib/api/model"

function codeColor(code: string) {
  const colors = [
    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  ]
  let hash = 0
  for (const c of code) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return colors[hash % colors.length]
}

// ── Course Dialog ─────────────────────────────────────────────────────────────

interface CourseDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: CourseDto | null
}

function CourseDialog({ open, onOpenChange, editing }: CourseDialogProps) {
  const qc = useQueryClient()
  const [code, setCode] = useState(editing?.code ?? "")
  const [title, setTitle] = useState(editing?.title ?? "")

  // Reset when dialog opens
  const handleOpen = (v: boolean) => {
    if (v) {
      setCode(editing?.code ?? "")
      setTitle(editing?.title ?? "")
    }
    onOpenChange(v)
  }

  const create = usePostApiCourses({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/Courses"] }); onOpenChange(false) } },
  })
  const update = usePutApiCoursesId({
    mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/Courses"] }); onOpenChange(false) } },
  })

  const isPending = create.isPending || update.isPending

  function handleSubmit() {
    if (!code.trim() || !title.trim()) return
    if (editing) {
      update.mutate({ id: editing.id, data: { id: editing.id, code: code.trim(), title: title.trim() } })
    } else {
      create.mutate({ data: { code: code.trim(), title: title.trim() } })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Course" : "New Course"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Course Code <span className="text-destructive">*</span></Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS101" />
          </div>
          <div className="space-y-1.5">
            <Label>Course Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Introduction to Computer Science" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!code.trim() || !title.trim() || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const qc = useQueryClient()
  const { data: courses, isLoading } = useGetApiCourses()
  const deleteCourse = useDeleteApiCoursesId({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/Courses"] }) },
  })

  const [dialogOpen, setDialog] = useState(false)
  const [editing, setEditing]   = useState<CourseDto | null>(null)
  const [search, setSearch]     = useState("")

  function openCreate() { setEditing(null); setDialog(true) }
  function openEdit(c: CourseDto) { setEditing(c); setDialog(true) }

  const filtered = (courses ?? []).filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground">
            {(courses ?? []).length} course{(courses ?? []).length !== 1 ? "s" : ""} in catalog
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by code or title…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No courses found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Try a different search term." : 'Click "Add Course" to create your first one.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <Card
              key={String(course.id)}
              className="group relative hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold ${codeColor(course.code)}`}>
                    {course.code}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(course)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteCourse.mutate({ id: course.id })}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-base leading-snug mt-2">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2 mt-2 pt-3 border-t opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1.5" onClick={() => openEdit(course)}>
                    <Pencil className="h-3 w-3" />Edit
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="flex-1 h-7 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => deleteCourse.mutate({ id: course.id })}
                  >
                    <Trash2 className="h-3 w-3" />Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <button
            onClick={openCreate}
            className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 min-h-[140px] transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 flex items-center justify-center transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Add new course</span>
          </button>
        </div>
      )}

      <CourseDialog open={dialogOpen} onOpenChange={setDialog} editing={editing} />
    </div>
  )
}
