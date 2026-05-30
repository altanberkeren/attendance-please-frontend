"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  ChevronRight,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  getGetApiCourseOfferingsQueryKey,
  useDeleteApiCourseOfferingsId,
  useGetApiCourseOfferings,
  usePostApiCourseOfferings,
  usePutApiCourseOfferingsId,
} from "@/lib/api/course-offerings/course-offerings";
import {
  getGetApiCoursesQueryKey,
  useGetApiCourses,
  usePostApiCourses,
} from "@/lib/api/courses/courses";
import type {
  CourseDto,
  CourseOfferingDto,
  CreateCourseCommand,
  CreateCourseOfferingCommand,
  CreateTermCommand,
  TermDto,
  UpdateCourseOfferingCommand,
  UpdateTermCommand,
} from "@/lib/api/model";
import {
  getGetApiTermsQueryKey,
  useDeleteApiTermsId,
  useGetApiTerms,
  usePostApiTerms,
  usePutApiTermsId,
} from "@/lib/api/terms/terms";

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    acc[k] ??= [];
    acc[k].push(item);
    return acc;
  }, {});
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString() : "";
}

function InlineCourseForm({
  initialName,
  onSave,
  onCancel,
  saving,
}: {
  initialName: string;
  onSave: (c: CreateCourseCommand) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [code, setCode] = useState(initialName);
  const [title, setTitle] = useState("");
  const valid = title.trim() && code.trim();

  return (
    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-primary">New Course</p>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Label className="text-xs">Code</Label>
      <Input className="h-8 text-sm font-mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS101" autoFocus />
      <Label className="text-xs">Title</Label>
      <Input className="h-8 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Introduction to Computer Science" />
      <Button
        size="sm"
        className="h-8 w-full text-xs"
        disabled={!valid || saving}
        onClick={() => onSave({ code: code.trim().toUpperCase(), title: title.trim(), description: null })}
      >
        Add Course
      </Button>
    </div>
  );
}

function InlineTermForm({
  initialName,
  onSave,
  onCancel,
  saving,
}: {
  initialName: string;
  onSave: (t: CreateTermCommand) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const valid = name.trim() && startDate && endDate;

  return (
    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-primary">New Term</p>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Label className="text-xs">Term Name</Label>
      <Input className="h-8 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Fall 2025" autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Start Date</Label>
          <Input className="h-8 text-sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End Date</Label>
          <Input className="h-8 text-sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <Button size="sm" className="h-8 w-full text-xs" disabled={!valid || saving} onClick={() => onSave({ name: name.trim(), startDate, endDate })}>
        Add Term
      </Button>
    </div>
  );
}

function TermEditDialog({
  open,
  onOpenChange,
  term,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  term: TermDto | null;
  onSave: (t: UpdateTermCommand) => void;
  onDelete: (id: TermDto["id"]) => void;
}) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!open || !term) return;
    setName(term.code);
    setStartDate(term.startDate.slice(0, 10));
    setEndDate(term.endDate.slice(0, 10));
  }, [open, term]);

  if (!term) return null;

  const valid = name.trim() && startDate && endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Term</DialogTitle></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label>Term Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fall 2025" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => onDelete(term.id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!valid} onClick={() => { onSave({ id: term.id, name: name.trim(), startDate, endDate }); onOpenChange(false); }}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DeleteRequest = { kind: "offering" | "term"; id: number | string; title: string; description: string };

function DeleteConfirmationDialog({ request, onOpenChange, onConfirm }: { request: DeleteRequest | null; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{request?.title ?? "Delete item?"}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{request?.description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OfferingDialog({
  open,
  onOpenChange,
  courses,
  terms,
  onCourseCreate,
  onTermCreate,
  onSubmit,
  editing,
  creatingCourse,
  creatingTerm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courses: CourseDto[];
  terms: TermDto[];
  onCourseCreate: (c: CreateCourseCommand, onCreated: (c: CourseDto) => void) => void;
  onTermCreate: (t: CreateTermCommand, onCreated: (t: TermDto) => void) => void;
  onSubmit: (data: CreateCourseOfferingCommand | UpdateCourseOfferingCommand) => void;
  editing: CourseOfferingDto | null;
  creatingCourse?: boolean;
  creatingTerm?: boolean;
}) {
  const [courseId, setCourseId] = useState("");
  const [termId, setTermId] = useState("");
  const [note, setNote] = useState("");
  const [courseForm, setCourseForm] = useState<string | null>(null);
  const [termForm, setTermForm] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCourseId(editing ? String(editing.courseId) : "");
    setTermId(editing ? String(editing.termId) : "");
    setNote(editing?.note ?? "");
    setCourseForm(null);
    setTermForm(null);
  }, [open, editing]);

  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.title, sublabel: c.code }));
  const termOptions = terms.map((t) => ({ value: String(t.id), label: t.code, sublabel: `${formatDate(t.startDate)} → ${formatDate(t.endDate)}` }));

  function handleSubmit() {
    if (editing) {
      onSubmit({ id: editing.id, note: note.trim() || null });
      onOpenChange(false);
      return;
    }
    if (!courseId || !termId) return;
    onSubmit({ courseId, termId, note: note.trim() || null });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit Offering" : "New Course Offering"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label>Course</Label>
            <CreatableCombobox
              options={courseOptions}
              value={courseId}
              onChange={(v) => { setCourseId(v); setCourseForm(null); }}
              onCreate={(name) => { if (!editing) setCourseForm(name); }}
              placeholder="Select or create a course…"
              searchPlaceholder="Search courses…"
              createLabel="Create course"
            />
            {editing ? <p className="text-xs text-muted-foreground">Course cannot be changed for an existing offering.</p> : null}
            {courseForm !== null && !editing && (
              <InlineCourseForm initialName={courseForm} saving={creatingCourse} onSave={(c) => onCourseCreate(c, (created) => { setCourseId(String(created.id)); setCourseForm(null); })} onCancel={() => setCourseForm(null)} />
            )}
          </div>
          <div className="space-y-2">
            <Label>Term</Label>
            <CreatableCombobox
              options={termOptions}
              value={termId}
              onChange={(v) => { setTermId(v); setTermForm(null); }}
              onCreate={(name) => { if (!editing) setTermForm(name); }}
              placeholder="Select or create a term…"
              searchPlaceholder="Search terms…"
              createLabel="Create term"
            />
            {editing ? <p className="text-xs text-muted-foreground">Term cannot be changed for an existing offering.</p> : null}
            {termForm !== null && !editing && (
              <InlineTermForm initialName={termForm} saving={creatingTerm} onSave={(t) => onTermCreate(t, (created) => { setTermId(String(created.id)); setTermForm(null); })} onCancel={() => setTermForm(null)} />
            )}
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for this offering" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={(!editing && (!courseId || !termId)) || courseForm !== null || termForm !== null}>{editing ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CourseOfferingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialog] = useState(false);
  const [editing, setEditing] = useState<CourseOfferingDto | null>(null);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TermDto | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest | null>(null);

  const offeringsQuery = useGetApiCourseOfferings();
  const coursesQuery = useGetApiCourses();
  const termsQuery = useGetApiTerms();
  const offerings = offeringsQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const terms = termsQuery.data ?? [];

  const invalidateOfferings = () => queryClient.invalidateQueries({ queryKey: getGetApiCourseOfferingsQueryKey() });
  const invalidateCourses = () => queryClient.invalidateQueries({ queryKey: getGetApiCoursesQueryKey() });
  const invalidateTerms = () => queryClient.invalidateQueries({ queryKey: getGetApiTermsQueryKey() });

  const createOffering = usePostApiCourseOfferings({ mutation: { onSuccess: invalidateOfferings } });
  const updateOffering = usePutApiCourseOfferingsId({ mutation: { onSuccess: invalidateOfferings } });
  const deleteOffering = useDeleteApiCourseOfferingsId({ mutation: { onSuccess: invalidateOfferings } });
  const createCourse = usePostApiCourses({ mutation: { onSuccess: invalidateCourses } });
  const createTerm = usePostApiTerms({ mutation: { onSuccess: invalidateTerms } });
  const updateTerm = usePutApiTermsId({ mutation: { onSuccess: () => { invalidateTerms(); invalidateOfferings(); } } });
  const deleteTerm = useDeleteApiTermsId({ mutation: { onSuccess: () => { invalidateTerms(); invalidateOfferings(); } } });

  const grouped = useMemo(() => groupBy(offerings, (o) => String(o.termId)), [offerings]);
  const termOrder = Object.keys(grouped).sort((a, b) => {
    const aName = terms.find((t) => String(t.id) === a)?.code ?? grouped[a][0].termCode;
    const bName = terms.find((t) => String(t.id) === b)?.code ?? grouped[b][0].termCode;
    return bName.localeCompare(aName);
  });

  function openCreate() { setEditing(null); setDialog(true); }
  function openEdit(o: CourseOfferingDto) { setEditing(o); setDialog(true); }
  function openTermEdit(term: TermDto) { setEditingTerm(term); setTermDialogOpen(true); }

  function requestOfferingDelete(offering: CourseOfferingDto) {
    setDeleteRequest({ kind: "offering", id: offering.id, title: "Delete course offering?", description: `Delete ${offering.courseCode} ${offering.courseTitle}? This action cannot be undone.` });
  }
  function requestTermDelete(id: TermDto["id"]) {
    const term = terms.find((t) => t.id === id);
    setDeleteRequest({ kind: "term", id, title: "Delete term?", description: `Delete ${term?.code ?? "this term"}? This action cannot be undone.` });
  }
  function confirmDeleteRequest() {
    if (!deleteRequest) return;
    if (deleteRequest.kind === "offering") deleteOffering.mutate({ id: deleteRequest.id });
    else deleteTerm.mutate({ id: deleteRequest.id });
    setDeleteRequest(null);
  }

  const loading = offeringsQuery.isLoading || coursesQuery.isLoading || termsQuery.isLoading;
  const hasError = offeringsQuery.error || coursesQuery.error || termsQuery.error || createOffering.error || updateOffering.error || deleteOffering.error || createCourse.error || createTerm.error || updateTerm.error || deleteTerm.error;

  return (
    <div className="space-y-8 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Course Offerings</h1>
          <p className="text-sm text-muted-foreground">{offerings.length} offering{offerings.length !== 1 ? "s" : ""} across {termOrder.length} term{termOrder.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto"><Plus className="h-4 w-4" />Add Offering</Button>
      </div>

      {hasError ? <p className="text-sm text-destructive">Something went wrong while syncing course offerings. Please try again.</p> : null}

      {loading ? (
        <div className="py-24 text-center text-sm text-muted-foreground">Loading course offerings…</div>
      ) : offerings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4"><Layers className="h-6 w-6 text-muted-foreground" /></div>
          <p className="text-sm font-medium">No offerings yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Offering" to create your first one.</p>
        </div>
      ) : null}

      {termOrder.map((termId) => {
        const first = grouped[termId][0];
        const term = terms.find((t) => String(t.id) === termId);
        const termLabel = term?.code ?? first.termCode;
        return (
          <div key={termId} className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-4 w-4 text-primary" />
              {term ? (
                <button type="button" onClick={() => openTermEdit(term)} className="cursor-pointer text-base font-semibold hover:text-primary hover:underline underline-offset-4">{termLabel}</button>
              ) : <h2 className="text-base font-semibold">{termLabel}</h2>}
              <Badge variant="secondary" className="text-xs">{grouped[termId].length} offering{grouped[termId].length !== 1 ? "s" : ""}</Badge>
              <div className="flex-1 h-px bg-border" />
              {term ? <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openTermEdit(term)} aria-label={`Edit ${termLabel}`}><Pencil className="h-4 w-4" /></Button> : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped[termId].map((offering) => (
                <Card key={offering.id} className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-primary/10 text-primary">{offering.courseCode}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/course-offerings/detail?id=${encodeURIComponent(String(offering.id))}`)}><ChevronRight className="mr-2 h-3.5 w-3.5" />View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(offering)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit note</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => requestOfferingDelete(offering)}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="font-semibold text-sm leading-snug mb-2 line-clamp-2">{offering.courseTitle}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{offering.note || "No note added."}</p>
                    <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">Created {formatDate(offering.createdAt)}</p>
                    <div className="flex gap-2 mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button variant="default" size="sm" className="flex-1 h-7 text-xs gap-1.5" onClick={() => router.push(`/course-offerings/detail?id=${encodeURIComponent(String(offering.id))}`)}><ChevronRight className="h-3 w-3" />Details</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => openEdit(offering)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => requestOfferingDelete(offering)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      <OfferingDialog
        open={dialogOpen}
        onOpenChange={setDialog}
        courses={courses}
        terms={terms}
        editing={editing}
        creatingCourse={createCourse.isPending}
        creatingTerm={createTerm.isPending}
        onCourseCreate={(data, onCreated) => createCourse.mutate({ data }, { onSuccess: onCreated })}
        onTermCreate={(data, onCreated) => createTerm.mutate({ data }, { onSuccess: onCreated })}
        onSubmit={(data) => {
          if ("courseId" in data) createOffering.mutate({ data });
          else updateOffering.mutate({ id: data.id, data });
        }}
      />
      <TermEditDialog open={termDialogOpen} onOpenChange={setTermDialogOpen} term={editingTerm} onSave={(data) => updateTerm.mutate({ id: data.id, data })} onDelete={requestTermDelete} />
      <DeleteConfirmationDialog request={deleteRequest} onOpenChange={(open) => { if (!open) setDeleteRequest(null); }} onConfirm={confirmDeleteRequest} />
    </div>
  );
}
