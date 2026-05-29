"use client";

import {
  CalendarCheck,
  ChevronRight,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type CourseOffering,
  MOCK_COURSE_OFFERINGS,
} from "@/lib/mock/course-offerings";
import { type Course, MOCK_COURSES } from "@/lib/mock/courses";
import { MOCK_TERMS, type Term } from "@/lib/mock/terms";

// ── helpers ───────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    acc[k] ??= [];
    acc[k].push(item);
    return acc;
  }, {});
}

const SECTION_COLORS: Record<string, string> = {
  A: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  B: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  C: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  D: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};
function sectionColor(sec: string) {
  return SECTION_COLORS[sec.toUpperCase()] ?? "bg-primary/10 text-primary";
}

// ── Inline Course Form ────────────────────────────────────────────────────────

function InlineCourseForm({
  initialName,
  onSave,
  onCancel,
}: {
  initialName: string;
  onSave: (c: Course) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(initialName);
  const [title, setTitle] = useState("");
  const valid = title.trim() && code.trim();

  return (
    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-primary">New Course</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">
          Code <span className="text-destructive">*</span>
        </Label>
        <Input
          className="h-8 text-sm font-mono"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CS101"
          autoFocus
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          className="h-8 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Introduction to Computer Science"
        />
      </div>
      <Button
        size="sm"
        className="h-8 w-full text-xs"
        disabled={!valid}
        onClick={() =>
          onSave({
            id: Date.now().toString(),
            name: title.trim(),
            code: code.trim().toUpperCase(),
            description: "",
          })
        }
      >
        Add Course
      </Button>
    </div>
  );
}

// ── Inline Term Form ──────────────────────────────────────────────────────────

function InlineTermForm({
  initialName,
  onSave,
  onCancel,
}: {
  initialName: string;
  onSave: (t: Term) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const valid = name.trim() && startDate && endDate;

  return (
    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-primary">New Term</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">
          Term Name <span className="text-destructive">*</span>
        </Label>
        <Input
          className="h-8 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Fall 2025"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">
            Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            className="h-8 text-sm"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            End Date <span className="text-destructive">*</span>
          </Label>
          <Input
            className="h-8 text-sm"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <Button
        size="sm"
        className="h-8 w-full text-xs"
        disabled={!valid}
        onClick={() =>
          onSave({
            id: Date.now().toString(),
            name: name.trim(),
            startDate,
            endDate,
          })
        }
      >
        Add Term
      </Button>
    </div>
  );
}

// ── Create Offering Dialog ────────────────────────────────────────────────────

interface CreateOfferingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courses: Course[];
  terms: Term[];
  onCourseCreate: (c: Course) => void;
  onTermCreate: (t: Term) => void;
  onSubmit: (courseId: string, termId: string) => void;
  editing: CourseOffering | null;
}

function CreateOfferingDialog({
  open,
  onOpenChange,
  courses,
  terms,
  onCourseCreate,
  onTermCreate,
  onSubmit,
  editing,
}: CreateOfferingDialogProps) {
  const [courseId, setCourseId] = useState(editing?.courseId ?? "");
  const [termId, setTermId] = useState(editing?.termId ?? "");
  const [courseForm, setCourseForm] = useState<string | null>(null); // null = hidden, string = prefilled name
  const [termForm, setTermForm] = useState<string | null>(null);

  function handleOpen(v: boolean) {
    if (v) {
      setCourseId(editing?.courseId ?? "");
      setTermId(editing?.termId ?? "");
      setCourseForm(null);
      setTermForm(null);
    }
    onOpenChange(v);
  }

  function handleSubmit() {
    if (!courseId || !termId) return;
    onSubmit(courseId, termId);
    onOpenChange(false);
  }

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.code,
  }));
  const termOptions = terms.map((t) => ({
    value: t.id,
    label: t.name,
    sublabel:
      t.startDate && t.endDate ? `${t.startDate} → ${t.endDate}` : undefined,
  }));

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedTerm = terms.find((t) => t.id === termId);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Offering" : "New Course Offering"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* ── Course field ── */}
          <div className="space-y-2">
            <Label>
              Course <span className="text-destructive">*</span>
            </Label>
            <CreatableCombobox
              options={courseOptions}
              value={courseId}
              onChange={(v) => {
                setCourseId(v);
                setCourseForm(null);
              }}
              onCreate={(name) => {
                setCourseForm(name);
                setTermForm(null);
              }}
              placeholder="Select or create a course…"
              searchPlaceholder="Search courses…"
              createLabel="Create course"
            />
            {selectedCourse && !courseForm && (
              <p className="text-xs text-muted-foreground">
                Code:{" "}
                <span className="font-mono font-medium">
                  {selectedCourse.code}
                </span>
              </p>
            )}
            {courseForm !== null && (
              <InlineCourseForm
                initialName={courseForm}
                onSave={(c) => {
                  onCourseCreate(c);
                  setCourseId(c.id);
                  setCourseForm(null);
                }}
                onCancel={() => setCourseForm(null)}
              />
            )}
          </div>

          {/* ── Term field ── */}
          <div className="space-y-2">
            <Label>
              Term <span className="text-destructive">*</span>
            </Label>
            <CreatableCombobox
              options={termOptions}
              value={termId}
              onChange={(v) => {
                setTermId(v);
                setTermForm(null);
              }}
              onCreate={(name) => {
                setTermForm(name);
                setCourseForm(null);
              }}
              placeholder="Select or create a term…"
              searchPlaceholder="Search terms…"
              createLabel="Create term"
            />
            {selectedTerm && !termForm && selectedTerm.startDate && (
              <p className="text-xs text-muted-foreground">
                {selectedTerm.startDate} → {selectedTerm.endDate}
              </p>
            )}
            {termForm !== null && (
              <InlineTermForm
                initialName={termForm}
                onSave={(t) => {
                  onTermCreate(t);
                  setTermId(t.id);
                  setTermForm(null);
                }}
                onCancel={() => setTermForm(null)}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !courseId || !termId || courseForm !== null || termForm !== null
            }
          >
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CourseOfferingsPage() {
  const router = useRouter();

  const [offerings, setOfferings] = useState<CourseOffering[]>(
    MOCK_COURSE_OFFERINGS,
  );
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [terms, setTerms] = useState<Term[]>(MOCK_TERMS);
  const [dialogOpen, setDialog] = useState(false);
  const [editing, setEditing] = useState<CourseOffering | null>(null);

  function openCreate() {
    setEditing(null);
    setDialog(true);
  }
  function openEdit(o: CourseOffering) {
    setEditing(o);
    setDialog(true);
  }
  function handleDelete(id: string) {
    setOfferings((p) => p.filter((o) => o.id !== id));
  }
  function handleCourseCreate(c: Course) {
    setCourses((p) => [...p, c]);
  }
  function handleTermCreate(t: Term) {
    setTerms((p) => [...p, t]);
  }

  function handleSubmit(courseId: string, termId: string) {
    const course = courses.find((c) => c.id === courseId);
    const term = terms.find((t) => t.id === termId);
    if (!course || !term) return;

    if (editing) {
      setOfferings((p) =>
        p.map((o) =>
          o.id === editing.id
            ? {
                ...o,
                courseId,
                termId,
                courseName: course.name,
                termName: term.name,
              }
            : o,
        ),
      );
    } else {
      setOfferings((p) => [
        ...p,
        {
          id: Date.now().toString(),
          courseId,
          termId,
          courseName: course.name,
          termName: term.name,
          section: "A",
          students: [],
          staff: [],
          sessions: [],
        },
      ]);
    }
  }

  const grouped = groupBy(offerings, (o) => o.termName);
  const termOrder = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Course Offerings
          </h1>
          <p className="text-sm text-muted-foreground">
            {offerings.length} offering{offerings.length !== 1 ? "s" : ""}{" "}
            across {termOrder.length} term{termOrder.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Offering
        </Button>
      </div>

      {offerings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No offerings yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Add Offering" to create your first one.
          </p>
        </div>
      )}

      {termOrder.map((term) => (
        <div key={term} className="space-y-3">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">{term}</h2>
            <Badge variant="secondary" className="text-xs">
              {grouped[term].length} offering
              {grouped[term].length !== 1 ? "s" : ""}
            </Badge>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped[term].map((offering) => (
              <Card
                key={offering.id}
                className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${sectionColor(offering.section)}`}
                    >
                      Section {offering.section}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/course-offerings/${offering.id}`)
                          }
                        >
                          <ChevronRight className="mr-2 h-3.5 w-3.5" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(offering)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(offering.id)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="font-semibold text-sm leading-snug mb-3 line-clamp-2">
                    {offering.courseName}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {offering.students.length} students
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCog className="h-3.5 w-3.5" />
                      {offering.staff.length} staff
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="h-3.5 w-3.5" />
                      {offering.sessions.length} sessions
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-7 text-xs gap-1.5"
                      onClick={() =>
                        router.push(`/course-offerings/${offering.id}`)
                      }
                    >
                      <ChevronRight className="h-3 w-3" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => openEdit(offering)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => handleDelete(offering.id)}
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

      <CreateOfferingDialog
        open={dialogOpen}
        onOpenChange={setDialog}
        courses={courses}
        terms={terms}
        onCourseCreate={handleCourseCreate}
        onTermCreate={handleTermCreate}
        onSubmit={handleSubmit}
        editing={editing}
      />
    </div>
  );
}
