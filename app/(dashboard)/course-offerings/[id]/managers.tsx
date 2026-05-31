"use client";

import { Fragment, useState } from "react";
import { Layers, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CreateModuleCommand,
  EnrollmentDto,
  ModuleDto,
  SectionDto,
  SessionDto,
  UpdateModuleCommand,
} from "@/lib/api/model";
import { cn } from "@/lib/utils";
import { EmptyTabState } from "./detail-shared";

export function SectionManager({
  sections,
  enrollments,
  sessions,
  activeSectionId,
  loading,
  pending,
  canManage,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  sections: SectionDto[];
  enrollments: EnrollmentDto[];
  sessions: SessionDto[];
  activeSectionId: string;
  loading: boolean;
  pending: boolean;
  canManage: boolean;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (section: SectionDto, name: string) => void;
  onDelete: (section: SectionDto) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  function usage(section: SectionDto) {
    const id = String(section.id);
    return {
      students: enrollments.filter((student) => String(student.sectionId) === id)
        .length,
      sessions: sessions.filter((session) => String(session.sectionId) === id)
        .length,
    };
  }

  function beginEdit(section: SectionDto) {
    setEditingId(String(section.id));
    setEditingName(section.name);
  }

  function finishEdit(section: SectionDto) {
    const name = editingName.trim();
    if (!name || name === section.name) {
      setEditingId(null);
      return;
    }
    onRename(section, name);
    setEditingId(null);
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName("");
    setCreateOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sections</CardTitle>
          {canManage ? (
            <Button size="sm" onClick={() => setCreateOpen(true)} disabled={pending}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sections.length === 0 ? (
          <EmptyTabState
            icon={Users}
            title="No sections yet"
            description="Add sections before importing or manually enrolling students."
            action={canManage ? (
              <Button size="sm" onClick={() => setCreateOpen(true)} disabled={pending}>
                <Plus className="mr-2 h-4 w-4" />
                Create first section
              </Button>
            ) : null}
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {sections.map((section) => {
              const counts = usage(section);
              const isEditing = editingId === String(section.id);
              const hasDependents = counts.students > 0 || counts.sessions > 0;
              return (
                <div key={String(section.id)} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <Input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") finishEdit(section);
                            if (event.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelect(String(section.id))}
                          className={cn(
                            "font-medium hover:text-primary hover:underline",
                            activeSectionId === String(section.id) &&
                              "text-primary",
                          )}
                        >
                          {section.name}
                        </button>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {counts.students} student{counts.students !== 1 ? "s" : ""} · {counts.sessions} session{counts.sessions !== 1 ? "s" : ""}
                      </p>
                      {hasDependents ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Move students and avoid linked sessions before deleting.
                        </p>
                      ) : null}
                    </div>
                    {canManage ? (
                      <div className="flex gap-1">
                        {isEditing ? (
                          <Button size="sm" onClick={() => finishEdit(section)} disabled={pending || !editingName.trim()}>
                            Save
                          </Button>
                        ) : (
                          <Button size="icon-xs" variant="ghost" onClick={() => beginEdit(section)} aria-label={`Rename ${section.name}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={pending || hasDependents}
                          onClick={() => onDelete(section)}
                          aria-label={`Delete ${section.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Section</DialogTitle>
            <DialogDescription>
              Create a new section for this course offering.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Section Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. A, B, Lab 1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || pending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function ModuleManager({
  courseOfferingId,
  modules,
  sessions,
  loading,
  pending,
  canManage,
  onCreate,
  onBulkCreate,
  onUpdate,
  onReorder,
  onDelete,
}: {
  courseOfferingId: number | string;
  modules: ModuleDto[];
  sessions: SessionDto[];
  loading: boolean;
  pending: boolean;
  canManage: boolean;
  onCreate: (module: CreateModuleCommand) => void;
  onBulkCreate: (modules: CreateModuleCommand[]) => void;
  onUpdate: (id: ModuleDto["id"], module: UpdateModuleCommand) => void;
  onReorder: (modules: UpdateModuleCommand[]) => void;
  onDelete: (module: ModuleDto) => void;
}) {
  const sortedModules = [...modules].sort(
    (a, b) => Number(a.orderIndex) - Number(b.orderIndex),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [bulkCount, setBulkCount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);

  function sessionCount(module: ModuleDto) {
    return sessions.filter((session) => String(session.moduleId) === String(module.id)).length;
  }

  function nextOrderIndex() {
    const maxOrder = sortedModules.reduce(
      (max, module) => Math.max(max, Number(module.orderIndex) || 0),
      0,
    );
    return maxOrder + 1;
  }

  function beginAdd() {
    setIsAdding(true);
    setNewTitle("");
  }

  function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;
    onCreate({ courseOfferingId, title, orderIndex: nextOrderIndex() });
    setNewTitle("");
    setIsAdding(false);
  }

  function handleBulkCreate() {
    const count = Number(bulkCount);
    if (!Number.isInteger(count) || count <= 0 || count > 52) return;
    const start = nextOrderIndex();
    onBulkCreate(
      Array.from({ length: count }, (_, index) => {
        const orderIndex = start + index;
        return {
          courseOfferingId,
          title: `Week ${orderIndex}:`,
          orderIndex,
        };
      }),
    );
    setBulkCount("");
  }

  function beginEdit(module: ModuleDto) {
    setEditingId(String(module.id));
    setEditingTitle(module.title);
  }

  function finishEdit(module: ModuleDto) {
    const title = editingTitle.trim();
    if (!title || title === module.title) {
      setEditingId(null);
      return;
    }
    onUpdate(module.id, { id: module.id, title, orderIndex: module.orderIndex });
    setEditingId(null);
  }

  function clearDragState() {
    setDraggingId(null);
    setDragOver(null);
  }

  function handleDragOver(event: React.DragEvent<HTMLLIElement>, targetId: ModuleDto["id"]) {
    event.preventDefault();
    if (!draggingId || draggingId === String(targetId)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setDragOver({ id: String(targetId), position });
  }

  function reorderModules(targetId: ModuleDto["id"], position: "before" | "after") {
    if (!draggingId || draggingId === String(targetId)) {
      clearDragState();
      return;
    }

    const moved = sortedModules.find((module) => String(module.id) === draggingId);
    if (!moved) {
      clearDragState();
      return;
    }

    const reordered = sortedModules.filter((module) => String(module.id) !== draggingId);
    const targetIndex = reordered.findIndex((module) => String(module.id) === String(targetId));
    if (targetIndex < 0) {
      clearDragState();
      return;
    }

    reordered.splice(position === "before" ? targetIndex : targetIndex + 1, 0, moved);

    const updates = reordered
      .map((module, index) => ({
        id: module.id,
        title: module.title,
        orderIndex: index + 1,
      }))
      .filter((module) => {
        const original = sortedModules.find((candidate) => String(candidate.id) === String(module.id));
        return original && Number(original.orderIndex) !== Number(module.orderIndex);
      });

    if (updates.length > 0) onReorder(updates);
    clearDragState();
  }

  function renderDragPreview(targetId: ModuleDto["id"], position: "before" | "after") {
    const draggedModule = sortedModules.find((module) => String(module.id) === draggingId);
    if (!draggedModule || dragOver?.id !== String(targetId) || dragOver.position !== position) return null;
    return (
      <li className="pointer-events-none rounded-xl border border-primary/40 bg-primary/10 p-3 text-primary shadow-sm">
        <div className="flex items-center gap-3 opacity-80">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold tabular-nums">
            ↕
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{draggedModule.title}</p>
            <p className="text-xs text-primary/80">Drop here</p>
          </div>
        </div>
      </li>
    );
  }

  const addRow = canManage && isAdding ? (
    <li className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary tabular-nums">
          {nextOrderIndex()}
        </div>
        <Input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleCreate();
            if (event.key === "Escape") setIsAdding(false);
          }}
          placeholder={`Week ${nextOrderIndex()}:`}
          autoFocus
        />
        <Button size="sm" onClick={handleCreate} disabled={pending || !newTitle.trim()}>
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
          Cancel
        </Button>
      </div>
    </li>
  ) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Modules</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag modules to set attendance order. New modules inherit their order from the list.
            </p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border bg-background p-1">
                <Input
                  className="h-8 w-24 border-0 shadow-none focus-visible:ring-0"
                  type="number"
                  min={1}
                  max={52}
                  value={bulkCount}
                  onChange={(event) => setBulkCount(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleBulkCreate();
                  }}
                  placeholder="Weeks"
                  aria-label="Number of modules to create"
                />
                <Button size="sm" variant="ghost" onClick={handleBulkCreate} disabled={pending || Number(bulkCount) <= 0}>
                  Auto-create
                </Button>
              </div>
              <Button size="sm" onClick={beginAdd} disabled={pending || isAdding}>
                <Plus className="mr-2 h-4 w-4" />
                Add Module
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sortedModules.length === 0 && !isAdding ? (
          <EmptyTabState
            icon={Layers}
            title="No modules yet"
            description="Add modules before staff start attendance sessions for this offering."
            action={canManage ? (
              <div className="mx-auto inline-flex items-center justify-center gap-2 rounded-md border bg-background p-1">
                <Input
                  className="h-8 w-24 border-0 shadow-none focus-visible:ring-0"
                  type="number"
                  min={1}
                  max={52}
                  value={bulkCount}
                  onChange={(event) => setBulkCount(event.target.value)}
                  placeholder="Weeks"
                  aria-label="Number of modules to create"
                />
                <Button size="sm" variant="ghost" onClick={handleBulkCreate} disabled={pending || Number(bulkCount) <= 0}>
                  Auto-create
                </Button>
              </div>
            ) : null}
          />
        ) : (
          <ul className="grid gap-2">
            {sortedModules.map((module, index) => {
              const isEditing = editingId === String(module.id);
              const count = sessionCount(module);
              const isDragging = draggingId === String(module.id);
              return (
                <Fragment key={String(module.id)}>
                  {renderDragPreview(module.id, "before")}
                  <li
                    key={String(module.id)}
                    draggable={canManage && !pending}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingId(String(module.id));
                    }}
                    onDragEnd={clearDragState}
                    onDragOver={(event) => handleDragOver(event, module.id)}
                    onDrop={() => reorderModules(module.id, dragOver?.position ?? "before")}
                    className={cn(
                      "rounded-xl border bg-card p-3 transition-colors hover:bg-muted/20",
                      canManage && "cursor-grab active:cursor-grabbing",
                      isDragging && "h-0 overflow-hidden border-0 p-0 opacity-0",
                      dragOver?.id === String(module.id) && !isDragging && "border-primary/30",
                    )}
                  >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary tabular-nums">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <Input
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") finishEdit(module);
                            if (event.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <button
                            type="button"
                            className="text-left font-medium leading-tight hover:text-primary hover:underline underline-offset-4"
                            onClick={() => beginEdit(module)}
                          >
                            {module.title}
                          </button>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {count} session{count !== 1 ? "s" : ""}
                          </p>
                        </>
                      )}
                    </div>
                    {canManage ? (
                      <div className="flex gap-1">
                        {isEditing ? (
                          <Button size="sm" onClick={() => finishEdit(module)} disabled={pending || !editingTitle.trim()}>
                            Save
                          </Button>
                        ) : (
                          <Button size="icon-xs" variant="ghost" onClick={() => beginEdit(module)} aria-label={`Edit ${module.title}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={pending || count > 0}
                          onClick={() => onDelete(module)}
                          aria-label={`Delete ${module.title}`}
                          title={count > 0 ? "Modules with sessions cannot be deleted from the UI." : "Delete module"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {count > 0 ? (
                    <p className="mt-2 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300">
                      This module already has attendance sessions; delete is disabled to protect attendance data.
                    </p>
                  ) : null}
                  </li>
                  {renderDragPreview(module.id, "after")}
                </Fragment>
              );
            })}
            {addRow}
            {canManage && !isAdding && sortedModules.length > 0 ? (
              <li>
                <Button variant="outline" className="w-full justify-start border-dashed" onClick={beginAdd} disabled={pending}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add another module
                </Button>
              </li>
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
