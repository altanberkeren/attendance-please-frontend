"use client";

import {
  BookOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { CrudDialog, type FieldDef } from "@/components/crud-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { type Course, MOCK_COURSES } from "@/lib/mock/courses";

// ── Schema ────────────────────────────────────────────────────────────────────

const courseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().min(1, "Description is required"),
});
type CourseFormValues = z.infer<typeof courseSchema>;

const FIELDS: FieldDef[] = [
  {
    name: "name",
    label: "Course name",
    placeholder: "Introduction to Computer Science",
  },
  { name: "code", label: "Course code", placeholder: "CS101" },
  {
    name: "description",
    label: "Description",
    placeholder: "What this course covers…",
  },
];
const EMPTY: CourseFormValues = { name: "", code: "", description: "" };

// Code → accent color for visual variety
const CODE_COLORS: Record<string, string> = {
  CS101: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  CS201: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  CS301: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CS401: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CS402: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};
function codeColor(code: string) {
  return CODE_COLORS[code] ?? "bg-primary/10 text-primary";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [dialogOpen, setDialog] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [search, setSearch] = useState("");

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditing(null);
    setDialog(true);
  }
  function openEdit(c: Course) {
    setEditing(c);
    setDialog(true);
  }
  function handleDelete(id: string) {
    setCourses((p) => p.filter((c) => c.id !== id));
  }

  function handleSubmit(raw: unknown) {
    const v = raw as CourseFormValues;
    if (editing) {
      setCourses((p) =>
        p.map((c) => (c.id === editing.id ? { ...c, ...v } : c)),
      );
    } else {
      setCourses((p) => [...p, { id: Date.now().toString(), ...v }]);
    }
  }

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} course{courses.length !== 1 ? "s" : ""} in catalog
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or code…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Card grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No courses found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search
              ? "Try a different search term."
              : 'Click "Add Course" to create your first one.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <Card
              key={course.id}
              className="group relative hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold ${codeColor(course.code)}`}
                  >
                    {course.code}
                  </div>

                  {/* Actions menu — always visible on mobile, fade in on desktop */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(course)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(course.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardTitle className="text-base leading-snug mt-2">
                  {course.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {course.description}
                </p>

                {/* Quick action row on hover */}
                <div className="flex gap-2 mt-4 pt-3 border-t opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs gap-1.5"
                    onClick={() => openEdit(course)}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add new placeholder */}
          <button
            type="button"
            onClick={openCreate}
            className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 min-h-[160px] transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 flex items-center justify-center transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Add new course
            </span>
          </button>
        </div>
      )}

      {/* ── CRUD Dialog ── */}
      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialog}
        title={editing ? "Edit Course" : "New Course"}
        schema={courseSchema}
        defaultValues={
          editing
            ? {
                name: editing.name,
                code: editing.code,
                description: editing.description,
              }
            : EMPTY
        }
        fields={FIELDS}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
