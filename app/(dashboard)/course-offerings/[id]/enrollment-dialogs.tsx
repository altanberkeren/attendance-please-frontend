"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
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
import type { EnrollmentDto, UserDto } from "@/lib/api/model";
import { studentNumberFromEmail } from "./offering-detail-utils";

export function ManualEnrollmentDialog({
  open,
  onOpenChange,
  sections,
  users,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: { id: number | string; name: string }[];
  users: UserDto[];
  onAdd: (student: {
    userId: number | string | null;
    studentNumber: string;
    importedName: string | null;
    sectionId: number | string;
    sectionName: string;
  }) => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [name, setName] = useState("");
  const [sectionId, setSectionId] = useState<string>("");
  const selectedSection =
    sections.find((section) => String(section.id) === sectionId) ?? sections[0];
  const selectedUser = users.find((user) => String(user.id) === selectedUserId);
  const effectiveStudentNumber =
    studentNumber.trim() || selectedUser?.studentNumber || studentNumberFromEmail(selectedUser?.email);
  const canSave = !!effectiveStudentNumber && !!selectedSection;
  const userOptions = users.map((user) => ({
    value: String(user.id),
    label: user.name,
    sublabel: `${(user.studentNumber ?? studentNumberFromEmail(user.email)) || "No student no"} · ${user.email}`,
  }));

  function reset() {
    setSelectedUserId("");
    setStudentNumber("");
    setName("");
    setSectionId("");
  }

  function handleUserChange(value: string) {
    setSelectedUserId(value);
    const user = users.find((candidate) => String(candidate.id) === value);
    if (!user) return;
    setStudentNumber(user.studentNumber ?? studentNumberFromEmail(user.email));
    setName(user.name);
  }

  function handleAdd() {
    if (!canSave || !selectedSection) return;
    onAdd({
      userId: selectedUser ? selectedUser.id : null,
      studentNumber: effectiveStudentNumber,
      importedName: name.trim() || selectedUser?.name || null,
      sectionId: selectedSection.id,
      sectionName: selectedSection.name,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Student Manually</DialogTitle>
          <DialogDescription>
            Select an existing student or enter a university student number.
            Name is optional for pending students and will be replaced when they log in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Registered Student</Label>
            <CreatableCombobox
              options={userOptions}
              value={selectedUserId}
              onChange={handleUserChange}
              onCreate={(value) => {
                setSelectedUserId("");
                setStudentNumber(value);
              }}
              placeholder="Search registered students…"
              searchPlaceholder="Search by name, email, or no…"
              createLabel="Use typed value as student number"
              emptyLabel="No registered student found."
            />
          </div>
          <div className="space-y-2">
            <Label>Student Number</Label>
            <Input
              value={studentNumber}
              onChange={(event) => {
                setSelectedUserId("");
                setStudentNumber(event.target.value);
              }}
              placeholder="e.g. 230302292"
            />
          </div>
          <div className="space-y-2">
            <Label>Name <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name from list"
            />
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <select
              value={sectionId || String(sections[0]?.id ?? "")}
              onChange={(event) => setSectionId(event.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              {sections.map((section) => (
                <option key={String(section.id)} value={String(section.id)}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!canSave}>
            Add Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditEnrollmentDialog({
  open,
  onOpenChange,
  enrollment,
  sections,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: EnrollmentDto | null;
  sections: { id: number | string; name: string }[];
  onSave: (student: {
    userId: number | string;
    userName: string;
    sectionId: number | string;
    sectionName: string;
  }) => void;
}) {
  const [studentNumber] = useState(() => enrollment?.studentNumber ?? "");
  const [name, setName] = useState(() => enrollment?.userName ?? "");
  const [sectionId, setSectionId] = useState<string>(() =>
    String(enrollment?.sectionId ?? ""),
  );

  const selectedSection =
    sections.find((section) => String(section.id) === sectionId) ??
    sections.find(
      (section) => String(section.id) === String(enrollment?.sectionId),
    ) ??
    sections[0];
  const canSave = !!enrollment && !!selectedSection;

  function handleSave() {
    if (!canSave || !selectedSection) return;
    onSave({
      userId: enrollment.userId ?? enrollment.studentNumber,
      userName: name.trim() || enrollment.userName,
      sectionId: selectedSection.id,
      sectionName: selectedSection.name,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update the enrolled student&apos;s visible info and section
            assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student Number</Label>
            <Input value={studentNumber} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Student Name</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <select
              value={sectionId || String(sections[0]?.id ?? "")}
              onChange={(event) => setSectionId(event.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              {sections.map((section) => (
                <option key={String(section.id)} value={String(section.id)}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
