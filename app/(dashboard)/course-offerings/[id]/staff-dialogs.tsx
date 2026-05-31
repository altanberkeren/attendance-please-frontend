"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
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
import type { CourseOfferingStaffDto, SectionDto, UserDto } from "@/lib/api/model";
import { CourseOfferingStaffAccessLevel, CourseOfferingStaffScope } from "@/lib/api/model";

export function StaffAssignmentDialog({
  open,
  onOpenChange,
  users,
  sections,
  assignedKeys,
  pending,
  allowOfferingScope,
  canAssignOwner,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserDto[];
  sections: SectionDto[];
  assignedKeys: Set<string>;
  pending: boolean;
  allowOfferingScope: boolean;
  canAssignOwner: boolean;
  onAssign: (assignment: {
    userId: number | string;
    scope: typeof CourseOfferingStaffScope[keyof typeof CourseOfferingStaffScope];
    accessLevel: typeof CourseOfferingStaffAccessLevel[keyof typeof CourseOfferingStaffAccessLevel];
    sectionId: number | string | null;
    roleTitle: string | null;
  }) => void;
}) {
  const [userId, setUserId] = useState("");
  const [scope, setScope] = useState<typeof CourseOfferingStaffScope[keyof typeof CourseOfferingStaffScope]>(allowOfferingScope ? CourseOfferingStaffScope.Offering : CourseOfferingStaffScope.Section);
  const [accessLevel, setAccessLevel] = useState<typeof CourseOfferingStaffAccessLevel[keyof typeof CourseOfferingStaffAccessLevel]>(CourseOfferingStaffAccessLevel.Assistant);
  const [sectionId, setSectionId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");

  const normalizedSectionId = scope === CourseOfferingStaffScope.Section ? sectionId : "";
  const selectedKey = `${userId}:${scope}:${normalizedSectionId}`;
  const accessLevels = Object.values(CourseOfferingStaffAccessLevel).filter((level) => canAssignOwner || level !== CourseOfferingStaffAccessLevel.Owner);
  const canSave = userId && (allowOfferingScope || scope === CourseOfferingStaffScope.Section) && (scope === CourseOfferingStaffScope.Offering || sectionId) && !assignedKeys.has(selectedKey);

  function handleAssign() {
    if (!canSave) return;
    onAssign({
      userId,
      scope,
      accessLevel,
      sectionId: scope === CourseOfferingStaffScope.Section ? sectionId : null,
      roleTitle: roleTitle.trim() || null,
    });
    setUserId("");
    setScope(allowOfferingScope ? CourseOfferingStaffScope.Offering : CourseOfferingStaffScope.Section);
    setAccessLevel(CourseOfferingStaffAccessLevel.Assistant);
    setSectionId("");
    setRoleTitle("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign course access</DialogTitle>
          <DialogDescription>
            Assign any user as offering-level or section-level staff without changing their global role.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>User</Label>
            <Combobox
              options={users.map((user) => ({
                value: String(user.id),
                label: user.name,
                sublabel: `${user.email} · ${user.role}`,
              }))}
              value={userId}
              onChange={setUserId}
              placeholder="Select a user…"
              searchPlaceholder="Search by name, email, or role…"
              emptyLabel="No user found."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Scope</Label>
              <select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {allowOfferingScope ? <option value={CourseOfferingStaffScope.Offering}>Offering</option> : null}
                <option value={CourseOfferingStaffScope.Section}>Section</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Access</Label>
              <select value={accessLevel} onChange={(event) => setAccessLevel(event.target.value as typeof accessLevel)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {accessLevels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
          </div>
          {scope === CourseOfferingStaffScope.Section ? (
            <div className="space-y-2">
              <Label>Section</Label>
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Select a section…</option>
                {sections.map((section) => <option key={String(section.id)} value={String(section.id)}>{section.name}</option>)}
              </select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="e.g. TA, Lab Assistant, Guest Lecturer" />
          </div>
          {assignedKeys.has(selectedKey) ? <p className="text-xs text-destructive">This user already has this exact assignment.</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!canSave || pending}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StaffEditDialog({
  open,
  onOpenChange,
  assignment,
  sections,
  assignedKeys,
  pending,
  allowOfferingScope,
  canAssignOwner,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: CourseOfferingStaffDto | null;
  sections: SectionDto[];
  assignedKeys: Set<string>;
  pending: boolean;
  allowOfferingScope: boolean;
  canAssignOwner: boolean;
  onUpdate: (assignment: {
    id: number | string;
    scope: typeof CourseOfferingStaffScope[keyof typeof CourseOfferingStaffScope];
    accessLevel: typeof CourseOfferingStaffAccessLevel[keyof typeof CourseOfferingStaffAccessLevel];
    sectionId: number | string | null;
    roleTitle: string | null;
  }) => void;
}) {
  const [scope, setScope] = useState<typeof CourseOfferingStaffScope[keyof typeof CourseOfferingStaffScope]>(CourseOfferingStaffScope.Section);
  const [accessLevel, setAccessLevel] = useState<typeof CourseOfferingStaffAccessLevel[keyof typeof CourseOfferingStaffAccessLevel]>(CourseOfferingStaffAccessLevel.Assistant);
  const [sectionId, setSectionId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");

  useEffect(() => {
    if (!assignment) return;
    setScope(assignment.scope);
    setAccessLevel(assignment.accessLevel);
    setSectionId(assignment.sectionId == null ? "" : String(assignment.sectionId));
    setRoleTitle(assignment.roleTitle ?? "");
  }, [assignment]);

  const currentKey = assignment
    ? `${assignment.userId}:${assignment.scope}:${assignment.scope === CourseOfferingStaffScope.Section ? String(assignment.sectionId) : ""}`
    : "";
  const selectedKey = assignment ? `${assignment.userId}:${scope}:${scope === CourseOfferingStaffScope.Section ? sectionId : ""}` : "";
  const accessLevels = Object.values(CourseOfferingStaffAccessLevel).filter((level) => canAssignOwner || level !== CourseOfferingStaffAccessLevel.Owner);
  const canSave = Boolean(
    assignment &&
    (allowOfferingScope || scope === CourseOfferingStaffScope.Section) &&
    (scope === CourseOfferingStaffScope.Offering || sectionId) &&
    (selectedKey === currentKey || !assignedKeys.has(selectedKey)),
  );

  function handleUpdate() {
    if (!assignment || !canSave) return;
    onUpdate({
      id: assignment.id,
      scope,
      accessLevel,
      sectionId: scope === CourseOfferingStaffScope.Section ? sectionId : null,
      roleTitle: roleTitle.trim() || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit course access</DialogTitle>
          <DialogDescription>
            Update scope, access level, section, or title for {assignment?.userName ?? "this staff member"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{assignment?.userName}</p>
            <p className="text-xs text-muted-foreground">{assignment?.userEmail}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Scope</Label>
              <select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {allowOfferingScope ? <option value={CourseOfferingStaffScope.Offering}>Offering</option> : null}
                <option value={CourseOfferingStaffScope.Section}>Section</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Access</Label>
              <select value={accessLevel} onChange={(event) => setAccessLevel(event.target.value as typeof accessLevel)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {accessLevels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
          </div>
          {scope === CourseOfferingStaffScope.Section ? (
            <div className="space-y-2">
              <Label>Section</Label>
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Select a section…</option>
                {sections.map((section) => <option key={String(section.id)} value={String(section.id)}>{section.name}</option>)}
              </select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="e.g. TA, Lab Assistant, Guest Lecturer" />
          </div>
          {selectedKey !== currentKey && assignedKeys.has(selectedKey) ? <p className="text-xs text-destructive">This user already has this exact assignment.</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={!canSave || pending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
