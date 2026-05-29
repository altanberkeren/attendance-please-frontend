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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { CrudDialog, type FieldDef } from "@/components/crud-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type CourseOffering,
  MOCK_COURSE_OFFERINGS,
} from "@/lib/mock/course-offerings";

// ── Schema ────────────────────────────────────────────────────────────────────

const offeringSchema = z.object({
  courseName: z.string().min(1, "Course name is required"),
  termName: z.string().min(1, "Term is required"),
  section: z.string().min(1, "Section is required"),
});
type OfferingFormValues = z.infer<typeof offeringSchema>;

const FIELDS: FieldDef[] = [
  {
    name: "courseName",
    label: "Course name",
    placeholder: "Introduction to Computer Science",
  },
  { name: "termName", label: "Term", placeholder: "Fall 2025" },
  { name: "section", label: "Section", placeholder: "A" },
];
const EMPTY: OfferingFormValues = { courseName: "", termName: "", section: "" };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Group an array by a key */
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CourseOfferingsPage() {
  const router = useRouter();
  const [offerings, setOfferings] = useState<CourseOffering[]>(
    MOCK_COURSE_OFFERINGS,
  );
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

  function handleSubmit(raw: unknown) {
    const v = raw as OfferingFormValues;
    if (editing) {
      setOfferings((p) =>
        p.map((o) => (o.id === editing.id ? { ...o, ...v } : o)),
      );
    } else {
      setOfferings((p) => [
        ...p,
        {
          id: Date.now().toString(),
          courseId: "",
          termId: "",
          students: [],
          staff: [],
          sessions: [],
          ...v,
        },
      ]);
    }
  }

  // Group offerings by term, most recent first
  const grouped = groupBy(offerings, (o) => o.termName);
  const termOrder = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8 max-w-screen-xl">
      {/* ── Page header ── */}
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

      {/* ── Empty state ── */}
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

      {/* ── Grouped term sections ── */}
      {termOrder.map((term) => (
        <div key={term} className="space-y-3">
          {/* Term header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">{term}</h2>
            </div>
            <Badge variant="secondary" className="text-xs">
              {grouped[term].length} offering
              {grouped[term].length !== 1 ? "s" : ""}
            </Badge>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Offering cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped[term].map((offering) => (
              <Card
                key={offering.id}
                className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <CardContent className="p-4">
                  {/* Top row: section badge + menu */}
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

                  {/* Course name */}
                  <p className="font-semibold text-sm leading-snug mb-3 line-clamp-2">
                    {offering.courseName}
                  </p>

                  {/* Stats row */}
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

                  {/* Actions — appear on hover */}
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
                      className="h-7 text-xs gap-1 px-2"
                      onClick={() => openEdit(offering)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
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

      {/* ── CRUD Dialog ── */}
      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialog}
        title={editing ? "Edit Offering" : "New Course Offering"}
        schema={offeringSchema}
        defaultValues={
          editing
            ? {
                courseName: editing.courseName,
                termName: editing.termName,
                section: editing.section,
              }
            : EMPTY
        }
        fields={FIELDS}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
