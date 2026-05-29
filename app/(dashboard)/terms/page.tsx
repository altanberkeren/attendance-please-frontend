"use client";

import {
  CalendarDays,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { CrudDialog, type FieldDef } from "@/components/crud-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_TERMS, type Term } from "@/lib/mock/terms";

// ── Schema ────────────────────────────────────────────────────────────────────

const termSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});
type TermFormValues = z.infer<typeof termSchema>;

const FIELDS: FieldDef[] = [
  { name: "name", label: "Term name", placeholder: "Fall 2025" },
  { name: "startDate", label: "Start date", type: "date" },
  { name: "endDate", label: "End date", type: "date" },
];
const EMPTY: TermFormValues = { name: "", startDate: "", endDate: "" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function termStatus(
  start: string,
  end: string,
): "active" | "upcoming" | "past" {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now >= s && now <= e) return "active";
  if (now < s) return "upcoming";
  return "past";
}

function durationDays(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86_400_000);
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: "active" | "upcoming" | "past" }) {
  if (status === "active")
    return <Badge className="text-xs animate-pulse">Active</Badge>;
  if (status === "upcoming")
    return (
      <Badge variant="secondary" className="text-xs">
        Upcoming
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Past
    </Badge>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>(MOCK_TERMS);
  const [dialogOpen, setDialog] = useState(false);
  const [editing, setEditing] = useState<Term | null>(null);

  function openCreate() {
    setEditing(null);
    setDialog(true);
  }
  function openEdit(t: Term) {
    setEditing(t);
    setDialog(true);
  }
  function handleDelete(id: string) {
    setTerms((p) => p.filter((t) => t.id !== id));
  }

  function handleSubmit(raw: unknown) {
    const v = raw as TermFormValues;
    if (editing) {
      setTerms((p) => p.map((t) => (t.id === editing.id ? { ...t, ...v } : t)));
    } else {
      setTerms((p) => [...p, { id: Date.now().toString(), ...v }]);
    }
  }

  const active = terms.filter(
    (t) => termStatus(t.startDate, t.endDate) === "active",
  );
  const upcoming = terms.filter(
    (t) => termStatus(t.startDate, t.endDate) === "upcoming",
  );
  const past = terms.filter(
    (t) => termStatus(t.startDate, t.endDate) === "past",
  );
  const sorted = [...active, ...upcoming, ...past];

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Terms</h1>
          <p className="text-sm text-muted-foreground">
            {terms.length} academic term{terms.length !== 1 ? "s" : ""}{" "}
            configured
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Term
        </Button>
      </div>

      {/* ── Term cards ── */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No terms yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Add Term" to create your first academic term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((term) => {
            const status = termStatus(term.startDate, term.endDate);
            const days = durationDays(term.startDate, term.endDate);
            const isActive = status === "active";

            return (
              <Card
                key={term.id}
                className={`group relative hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                  isActive ? "border-primary/40 ring-1 ring-primary/20" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={status} />
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
                        <DropdownMenuItem onClick={() => openEdit(term)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(term.id)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardTitle className="text-lg mt-2">{term.name}</CardTitle>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Date range */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground text-xs">
                        Start
                      </span>
                      <span className="font-medium text-xs ml-auto">
                        {fmt(term.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground text-xs">End</span>
                      <span className="font-medium text-xs ml-auto">
                        {fmt(term.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Duration progress bar */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {days} days
                      </span>
                      {isActive && (
                        <span className="text-primary font-medium">
                          In progress
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isActive
                            ? "bg-primary"
                            : status === "upcoming"
                              ? "bg-secondary"
                              : "bg-muted-foreground/30"
                        }`}
                        style={{
                          width: isActive
                            ? `${Math.min(100, ((Date.now() - new Date(term.startDate).getTime()) / (new Date(term.endDate).getTime() - new Date(term.startDate).getTime())) * 100)}%`
                            : status === "past"
                              ? "100%"
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-2 pt-2 border-t opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs gap-1.5"
                      onClick={() => openEdit(term)}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => handleDelete(term.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add placeholder */}
          <button
            type="button"
            onClick={openCreate}
            className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 min-h-[200px] transition-all duration-200"
          >
            <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 flex items-center justify-center transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Add new term
            </span>
          </button>
        </div>
      )}

      {/* ── CRUD Dialog ── */}
      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialog}
        title={editing ? "Edit Term" : "New Term"}
        schema={termSchema}
        defaultValues={
          editing
            ? {
                name: editing.name,
                startDate: editing.startDate,
                endDate: editing.endDate,
              }
            : EMPTY
        }
        fields={FIELDS}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
