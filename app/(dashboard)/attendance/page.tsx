"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ExternalLink,
  Loader2,
  Nfc,
  Pencil,
  QrCode,
  RefreshCw,
  Scan,
  Search,
  StopCircle,
  UserPlus,
  Wifi,
} from "lucide-react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useEffect, useRef, useState } from "react";
import { AttendanceRoster } from "@/components/attendance-roster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// ── API hooks ─────────────────────────────────────────────────────────────────

import {
  useGetApiAttendancesSessionSessionId,
  usePostApiAttendancesMark,
} from "@/lib/api/attendances/attendances";
import { useGetApiCourseOfferings } from "@/lib/api/course-offerings/course-offerings";
import { useGetApiEnrollments } from "@/lib/api/enrollments/enrollments";
import { useGetApiModules } from "@/lib/api/modules/modules";
import { useGetApiSections } from "@/lib/api/sections/sections";
import {
  useGetApiSessions,
  usePostApiSessions,
  usePostApiSessionsIdClose,
} from "@/lib/api/sessions/sessions";

// ── Backend model types ───────────────────────────────────────────────────────

import type {
  AttendanceDto,
  CourseOfferingDto,
  EnrollmentDto,
  ModuleDto,
  SectionDto,
  SessionDto,
} from "@/lib/api/model";
import { AttendanceMethod, AttendanceStatus } from "@/lib/api/model";

// ── Method config ─────────────────────────────────────────────────────────────

type MethodId = "qr" | "qr-wifi" | "nfc";

const METHOD_MAP: Record<MethodId, AttendanceMethod> = {
  qr: AttendanceMethod.Qr,
  "qr-wifi": AttendanceMethod.QrWifi,
  nfc: AttendanceMethod.Nfc,
};

const METHODS: {
  id: MethodId;
  label: string;
  icon: React.ElementType;
  secondaryIcon?: React.ElementType;
  color: string;
  bg: string;
  ring: string;
}[] = [
  {
    id: "qr",
    label: "QR Code",
    icon: QrCode,
    color: "text-primary",
    bg: "bg-primary/10",
    ring: "ring-primary",
  },
  {
    id: "qr-wifi",
    label: "QR + WiFi",
    icon: QrCode,
    secondaryIcon: Wifi,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500",
  },
  {
    id: "nfc",
    label: "NFC",
    icon: Nfc,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "course" | "session-setup" | "method" | "live";

interface Selection {
  courseId: number | string | null;
  sectionId: number | string | null;
  moduleId: number | string | null;
  method: MethodId | null;
}

// ── Hook: elapsed timer ───────────────────────────────────────────────────────

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEP_LIST = [
  { key: "course", label: "Course" },
  { key: "session-setup", label: "Module" },
  { key: "method", label: "Method" },
  { key: "live", label: "Live" },
];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEP_LIST.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-0 mb-2">
      {STEP_LIST.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                i < idx && "bg-primary text-primary-foreground",
                i === idx &&
                  "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2",
                i > idx && "bg-muted text-muted-foreground",
              )}
            >
              {i < idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:block",
                i === idx ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {i < STEP_LIST.length - 1 && (
            <div
              className={cn(
                "flex-1 h-px mx-3",
                i < idx ? "bg-primary" : "bg-muted",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Course ─────────────────────────────────────────────────────────────

function CourseStep({
  offerings,
  sel,
  setSel,
  onNext,
  isLoading,
}: {
  offerings: CourseOfferingDto[];
  sel: Selection;
  setSel: (s: Selection) => void;
  onNext: () => void;
  isLoading?: boolean;
}) {
  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  if (offerings.length === 0)
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        No courses assigned to you yet.
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Which course are you teaching right now?
        </p>
      </div>
      <div className="space-y-2">
        {offerings.map((c) => {
          const active = sel.courseId === c.id;
          return (
            <button type="button"
              key={String(c.id)}
              onClick={() =>
                setSel({
                  ...sel,
                  courseId: c.id,
                  sectionId: null,
                  moduleId: null,
                })
              }
              className={cn(
                "w-full text-left rounded-xl border px-4 py-3.5 transition-all",
                "hover:border-primary/50 hover:bg-muted/50",
                active && "border-primary bg-primary/5 ring-1 ring-primary/30",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {c.courseCode.replace(/[^A-Z]/g, "").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.courseCode}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.termCode}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {c.courseTitle}
                  </p>
                </div>
                {active && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!sel.courseId} className="gap-1.5">
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: Section + Module ───────────────────────────────────────────────────

function SessionSetupStep({
  modules,
  sections,
  sessions,
  sel,
  setSel,
  onNext,
  onBack,
  isLoading,
}: {
  modules: ModuleDto[];
  sections: SectionDto[];
  sessions: SessionDto[];
  sel: Selection;
  setSel: (s: Selection) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}) {
  const [showPastModules, setShowPastModules] = useState(false);

  // Auto-select if single section
  useEffect(() => {
    if (sections.length === 1 && sel.sectionId !== sections[0].id) {
      setSel({ ...sel, sectionId: sections[0].id });
    }
  }, [sections, sel, setSel]);

  const showSections = sections.length > 1;
  const sectionSessions = sel.sectionId
    ? sessions.filter(
        (session) => String(session.sectionId) === String(sel.sectionId),
      )
    : sessions;
  const attendedModuleIds = new Set(
    sectionSessions.map((session) => String(session.moduleId)),
  );
  const sortedModules = [...modules].sort(
    (a, b) => Number(a.orderIndex) - Number(b.orderIndex),
  );
  const upcomingModules = sortedModules.filter(
    (module) => !attendedModuleIds.has(String(module.id)),
  );
  const pastModules = sortedModules.filter((module) =>
    attendedModuleIds.has(String(module.id)),
  );
  const nextModule = upcomingModules[0] ?? pastModules[pastModules.length - 1];
  const visibleModules =
    upcomingModules.length > 0
      ? upcomingModules
      : nextModule
        ? [nextModule]
        : [];
  const hiddenPastModules =
    upcomingModules.length > 0
      ? pastModules
      : pastModules.filter(
          (module) => String(module.id) !== String(nextModule?.id),
        );

  useEffect(() => {
    if (!nextModule) return;
    if (
      !sel.moduleId ||
      hiddenPastModules.some(
        (module) => String(module.id) === String(sel.moduleId),
      )
    ) {
      setSel({ ...sel, moduleId: nextModule.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nextModule?.id,
    sel.sectionId,
    sel,
    setSel,
    nextModule,
    hiddenPastModules.some,
  ]);

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  function renderModuleButton(
    module: ModuleDto,
    options?: { isNext?: boolean; isPast?: boolean },
  ) {
    const active = sel.moduleId === module.id;
    const takenCount = sectionSessions.filter(
      (session) => String(session.moduleId) === String(module.id),
    ).length;
    return (
      <button type="button"
        key={String(module.id)}
        onClick={() => setSel({ ...sel, moduleId: module.id })}
        className={cn(
          "w-full text-left rounded-lg border px-4 py-3 transition-all text-sm",
          "hover:border-primary/40 hover:bg-muted/50",
          active && "border-primary bg-primary/5 ring-1 ring-primary/20",
          options?.isNext && !active && "border-primary/30 bg-primary/5",
          options?.isPast && "bg-muted/20",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={active ? "font-semibold" : "font-medium"}>
                {module.title}
              </span>
              {options?.isNext && upcomingModules.length > 0 && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0">
                  Next
                </Badge>
              )}
              {options?.isPast && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {takenCount} taken
                </Badge>
              )}
            </div>
            {options?.isPast && (
              <p className="mt-1 text-xs text-muted-foreground">
                Previous module, available for retake or edits.
              </p>
            )}
          </div>
          {active && <Check className="h-4 w-4 text-primary shrink-0" />}
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-5">
      {showSections && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Section
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <button type="button"
                key={String(s.id)}
                onClick={() => {
                  setShowPastModules(false);
                  setSel({ ...sel, sectionId: s.id, moduleId: null });
                }}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                  sel.sectionId === s.id
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                    : "hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Module Week
            </p>
            {pastModules.length > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {pastModules.length} previous module
                {pastModules.length !== 1 ? "s" : ""} available
              </p>
            )}
          </div>
          {hiddenPastModules.length > 0 && (
            <Button
              type="button"
              variant={showPastModules ? "ghost" : "outline"}
              size="sm"
              className={cn(
                "shrink-0",
                !showPastModules &&
                  "border-primary/30 text-primary hover:bg-primary/5",
              )}
              onClick={() => setShowPastModules((value) => !value)}
            >
              {showPastModules ? "Hide" : "Show More"}
            </Button>
          )}
        </div>
        <div className="space-y-1.5">
          {visibleModules.map((module, index) =>
            renderModuleButton(module, { isNext: index === 0 }),
          )}
          {hiddenPastModules.length > 0 && showPastModules && (
            <div className="space-y-1.5 pt-2">
              <p className="text-xs text-muted-foreground">Previous modules</p>
              {hiddenPastModules.map((module) =>
                renderModuleButton(module, { isPast: true }),
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!sel.moduleId || (showSections && !sel.sectionId)}
          className="gap-1.5"
        >
          Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Method ─────────────────────────────────────────────────────────────

function MethodStep({
  sel,
  setSel,
  onNext,
  onBack,
  isLoading,
}: {
  sel: Selection;
  setSel: (s: Selection) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        How will students mark their attendance?
      </p>
      <div className="grid grid-cols-3 gap-3">
        {METHODS.map((m) => {
          const active = sel.method === m.id;
          return (
            <button type="button"
              key={m.id}
              onClick={() => setSel({ ...sel, method: m.id })}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border p-5 transition-all",
                "hover:border-primary/40 hover:bg-muted/50",
                active && `border-primary/60 ${m.bg} ring-2 ${m.ring}/20`,
              )}
            >
              <div
                className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center",
                  m.bg,
                )}
              >
                <m.icon className={cn("h-6 w-6", m.color)} />
              </div>
              <span className={cn("text-sm font-semibold", active && m.color)}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!sel.method || isLoading}
          className="gap-1.5"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Start Session <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Manual add panel ───────────────────────────────────────────────────────────

function ManualAddPanel({
  enrollments,
  markedUserIds,
  onMark,
}: {
  enrollments: EnrollmentDto[];
  markedUserIds: Set<string>;
  onMark: (userId: number | string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const available = enrollments.filter(
    (e) =>
      !markedUserIds.has(String(e.userId)) &&
      e.userName.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="rounded-xl border">
      <button type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors rounded-xl"
      >
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        <span>Manually add student</span>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground ml-auto transition-transform",
            open && "rotate-90",
          )}
        />
      </button>

      {open && (
        <div className="border-t px-4 pb-4 space-y-3">
          <div className="relative pt-3">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              style={{ top: "calc(50% + 6px)" }}
            />
            <Input
              placeholder="Search by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {available.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                No students found
              </p>
            ) : (
              available.map((e) => (
                <button
                  key={String(e.userId)}
                  type="button"
                  onClick={() => onMark(e.userId, e.userName)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted/60 cursor-pointer"
                >
                  <span className="font-medium">{e.userName}</span>
                  <span className="text-xs text-primary font-medium">
                    Mark present
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Live session ───────────────────────────────────────────────────────────────

function LiveSession({
  sel,
  offering,
  selectedModule,
  section,
  enrollments,
  backendSessionId,
  attendances,
  onClose,
  isClosing,
}: {
  sel: Selection;
  offering: CourseOfferingDto | undefined;
  selectedModule: ModuleDto | undefined;
  section: SectionDto | undefined;
  enrollments: EnrollmentDto[];
  backendSessionId: number | string;
  attendances: AttendanceDto[];
  onClose: () => void;
  isClosing: boolean;
}) {
  const [ended, setEnded] = useState(false);
  const [qrToken, setQrToken] = useState(
    () => `att://session/${backendSessionId}?ts=${Date.now()}`,
  );
  const [newUserIds, setNewUserIds] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState("");
  const prevAttCountRef = useRef(0);

  const timer = useTimer(!ended);

  const { mutateAsync: markAttendance } = usePostApiAttendancesMark();

  // Highlight newly arrived attendees
  useEffect(() => {
    if (attendances.length > prevAttCountRef.current) {
      const prev = prevAttCountRef.current;
      const newOnes = attendances.slice(prev).map((a) => String(a.userId));
      setNewUserIds((ids) => {
        const next = new Set(ids);
        for (const id of newOnes) next.add(id);
        return next;
      });
      setTimeout(() => {
        setNewUserIds((ids) => {
          const next = new Set(ids);
          for (const id of newOnes) next.delete(id);
          return next;
        });
      }, 800);
    }
    prevAttCountRef.current = attendances.length;
  }, [attendances]);

  const markedUserIds = new Set(attendances.map((a) => String(a.userId)));
  const presentList = attendances.filter(
    (a) => a.status === "Present" || a.status === "Late",
  );
  const absentList = enrollments.filter(
    (e) => !markedUserIds.has(String(e.userId)),
  );
  const pct = enrollments.length
    ? Math.round((presentList.length / enrollments.length) * 100)
    : 0;

  async function onMark(userId: number | string, _name: string) {
    try {
      await markAttendance({
        data: {
          userId,
          sessionId: backendSessionId,
          status: AttendanceStatus.Present,
          method: AttendanceMethod.Manual,
        },
      });
    } catch {
      // ignore - polling will pick it up
    }
  }

  function refreshQR() {
    setQrToken(`att://session/${backendSessionId}?ts=${Date.now()}`);
  }

  function openQRTab() {
    const params = new URLSearchParams({
      t: qrToken,
      c: offering?.courseCode ?? "",
      m: selectedModule?.title ?? "",
      s: section?.name ?? "",
    });
    window.open(`/qr?${params}`, "_blank", "noopener");
  }

  // ── Post-session summary ────────────────────────────────────────────────────
  if (ended) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <div className="flex flex-col items-center py-6 gap-4 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Session Complete</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {offering?.courseCode}
              {section ? ` · ${section.name}` : ""} · {selectedModule?.title}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              {
                label: "Present",
                value: presentList.length,
                cls: "text-primary",
              },
              {
                label: "Absent",
                value: enrollments.length - presentList.length,
                cls: "text-muted-foreground",
              },
              { label: "Duration", value: timer, cls: "" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border p-4 text-center"
              >
                <p className={cn("text-2xl font-bold", item.cls)}>
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance roster */}
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Attendance
            </span>
          </div>
          <div className="p-4">
            <AttendanceRoster
              present={presentList.map((a) => ({
                id: String(a.userId),
                name: a.userName,
                studentId: String(a.userId),
                via:
                  a.method === AttendanceMethod.Manual
                    ? ("manual" as const)
                    : ("auto" as const),
                markedAt: a.recordedAt ?? undefined,
              }))}
              absent={absentList.map((e) => ({
                id: String(e.userId),
                name: e.userName,
                studentId: String(e.userId),
              }))}
              mode="full"
            />
          </div>
        </div>

        <ManualAddPanel
          enrollments={enrollments}
          markedUserIds={markedUserIds}
          onMark={onMark}
        />

        <Button className="w-full gap-2" onClick={onClose} disabled={isClosing}>
          {isClosing && <Loader2 className="h-4 w-4 animate-spin" />}
          Save & Close
        </Button>
      </div>
    );
  }

  // ── Active session ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 rounded-xl border bg-card px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="font-semibold">{presentList.length}</span>
              <span className="text-muted-foreground">
                / {enrollments.length} present
              </span>
            </div>
            <span
              className={cn(
                "font-bold tabular-nums",
                pct >= 80
                  ? "text-primary"
                  : pct >= 60
                    ? "text-amber-500"
                    : "text-muted-foreground",
              )}
            >
              {pct}%
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center text-center py-3">
          <span className="font-mono text-lg font-bold">{timer}</span>
          <span className="text-[11px] text-muted-foreground">elapsed</span>
        </div>
      </div>

      {/* QR / NFC + roster */}
      <div className="grid grid-cols-5 gap-3" style={{ minHeight: 280 }}>
        <div className="col-span-3 rounded-xl border bg-card flex flex-col items-center justify-center p-5 gap-3">
          {(sel.method === "qr" || sel.method === "qr-wifi") && (
            <>
              {sel.method === "qr-wifi" && (
                <div className="flex items-center gap-1.5 text-xs text-blue-500 bg-blue-500/10 rounded-lg px-3 py-1.5 w-full justify-center">
                  <Wifi className="h-3.5 w-3.5" />
                  Campus WiFi:{" "}
                  <strong className="font-mono ml-1">IUS-Campus</strong>
                </div>
              )}
              <div className="p-3.5 rounded-2xl bg-white shadow border">
                <QRCode
                  value={qrToken}
                  size={155}
                  level="M"
                />
              </div>
              <div className="flex items-center gap-4">
                <button type="button"
                  onClick={refreshQR}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
                <button type="button"
                  onClick={openQRTab}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Project QR
                </button>
              </div>
            </>
          )}
          {sel.method === "nfc" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center h-28 w-28">
                <div
                  className="absolute inset-0 rounded-full border-2 border-violet-500/15 animate-ping"
                  style={{ animationDuration: "2s" }}
                />
                <div className="absolute inset-4 rounded-full border border-violet-500/25 animate-pulse" />
                <div className="h-14 w-14 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Nfc className="h-7 w-7 text-violet-500" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Waiting for taps</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Students tap their student card
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Student list */}
        <div className="col-span-2 rounded-xl border bg-card overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Students
            </span>
            <span className="text-xs text-muted-foreground">
              {presentList.length}/{enrollments.length}
            </span>
          </div>
          {/* Search */}
          <div className="px-2 py-1.5 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                placeholder="Search student..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1 text-[11px] bg-muted/40 border border-border/50 rounded-md outline-none focus:border-primary/40 focus:bg-background transition-colors"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 divide-y">
            {[...presentList]
              .reverse()
              .filter((a) =>
                a.userName.toLowerCase().includes(studentSearch.toLowerCase()),
              )
              .map((a) => (
                <div
                  key={String(a.userId)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 transition-colors duration-300",
                    newUserIds.has(String(a.userId)) && "bg-primary/10",
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-medium truncate flex-1">
                    {a.userName}
                  </span>
                  {a.method === AttendanceMethod.Manual && (
                    <span className="text-[9px] border rounded px-1 text-muted-foreground shrink-0">
                      M
                    </span>
                  )}
                </div>
              ))}
            {absentList
              .filter((e) =>
                e.userName.toLowerCase().includes(studentSearch.toLowerCase()),
              )
              .map((e) => (
                <div
                  key={String(e.userId)}
                  className="flex items-center gap-2 px-3 py-2 group"
                >
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {e.userName}
                  </span>
                  <button type="button"
                    onClick={() => onMark(e.userId, e.userName)}
                    className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline shrink-0"
                  >
                    Mark
                  </button>
                </div>
              ))}
            {absentList.length === 0 && presentList.length > 0 && (
              <div className="px-3 py-4 text-center text-xs text-primary font-medium">
                All present 🎉
              </div>
            )}
          </div>
        </div>
      </div>

      <ManualAddPanel
        enrollments={enrollments}
        markedUserIds={markedUserIds}
        onMark={onMark}
      />

      <div className="flex justify-end">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setEnded(true)}
          className="gap-2"
        >
          <StopCircle className="h-4 w-4" />
          End Session
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [step, setStep] = useState<Step>("course");
  const [sel, setSel] = useState<Selection>({
    courseId: null,
    sectionId: null,
    moduleId: null,
    method: null,
  });
  const [backendSessionId, setBackendSessionId] = useState<
    number | string | null
  >(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const { data: myOfferings, isLoading: loadingOfferings } =
    useGetApiCourseOfferings(userId ? { staffUserId: userId } : undefined, {
      query: { enabled: !!userId },
    });

  const selectedCourseOfferingId = sel.courseId ?? 0;

  const { data: apiModules, isLoading: loadingModules } = useGetApiModules(
    { courseOfferingId: selectedCourseOfferingId },
    { query: { enabled: !!sel.courseId } },
  );
  const { data: apiSections, isLoading: loadingSections } = useGetApiSections(
    { courseOfferingId: selectedCourseOfferingId },
    { query: { enabled: !!sel.courseId } },
  );
  const { data: apiEnrollmentsAll } = useGetApiEnrollments(
    { courseOfferingId: selectedCourseOfferingId },
    { query: { enabled: !!sel.courseId } },
  );
  const { data: apiSessions = [], isLoading: loadingSessions } =
    useGetApiSessions(
      { courseOfferingId: selectedCourseOfferingId },
      { query: { enabled: !!sel.courseId } },
    );

  const effectiveOfferings = myOfferings ?? [];
  const effectiveSections = apiSections ?? [];
  const effectiveModules = apiModules ?? [];
  const effectiveSessions = apiSessions;
  const effectiveEnrollmentsAll = apiEnrollmentsAll ?? [];

  // Filter enrollments by section client-side
  const enrollments = sel.sectionId
    ? effectiveEnrollmentsAll.filter(
        (e) => String(e.sectionId) === String(sel.sectionId),
      )
    : effectiveEnrollmentsAll;

  // Live attendance polling (every 3s while session is open)
  const { data: liveAttendances } = useGetApiAttendancesSessionSessionId(
    backendSessionId ?? 0,
    { query: { enabled: !!backendSessionId, refetchInterval: 3000 } },
  );

  // ── Mutations ───────────────────────────────────────────────────────────────
  const { mutateAsync: openSession } = usePostApiSessions();
  const { mutateAsync: closeSession } = usePostApiSessionsIdClose();

  // ── Timer ───────────────────────────────────────────────────────────────────
  const _timer = useTimer(step === "live" && !!backendSessionId);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const offering = effectiveOfferings.find((o) => o.id === sel.courseId);
  const selectedModule = effectiveModules.find((m) => m.id === sel.moduleId);
  const section = effectiveSections.find((s) => s.id === sel.sectionId);

  const [startError, setStartError] = useState<string | null>(null);

  async function handleStartSession() {
    if (!sel.moduleId || !sel.method || !userId) return;
    const openingUserId = userId;
    setIsOpening(true);
    setStartError(null);
    try {
      if (openingUserId == null) return;

      const session = await openSession({
        data: {
          moduleId: sel.moduleId,
          sectionId: sel.sectionId,
          selectedMethod: METHOD_MAP[sel.method],
          openedByUserId: openingUserId,
        },
      });
      setBackendSessionId(session.id);
      setStep("live");
    } catch {
      setStartError("Failed to start session. Please check your backend connection.");
    } finally {
      setIsOpening(false);
    }
  }

  async function handleClose() {
    if (!backendSessionId) return;
    setIsClosing(true);
    try {
      await closeSession({ id: backendSessionId });
      router.push(`/sessions/detail?id=${encodeURIComponent(String(backendSessionId))}`);
    } finally {
      setIsClosing(false);
    }
  }

  const isLive = step === "live";

  return (
    <div className="max-w-screen-md mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        {!isLive && (
          <button type="button"
            onClick={() => router.push("/overview")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Scan className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              AttendancePlease
            </h1>
            {isLive && offering && (
              <p className="text-xs text-muted-foreground">
                {offering.courseCode}
                {section ? ` · ${section.name}` : ""}
                {selectedModule ? ` · ${selectedModule.title}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {!isLive && <StepIndicator current={step} />}

      {step === "course" && (
        <CourseStep
          offerings={effectiveOfferings}
          sel={sel}
          setSel={setSel}
          onNext={() => setStep("session-setup")}
          isLoading={loadingOfferings}
        />
      )}

      {step === "session-setup" && (
        <SessionSetupStep
          modules={effectiveModules}
          sections={effectiveSections}
          sessions={effectiveSessions}
          sel={sel}
          setSel={setSel}
          onNext={() => setStep("method")}
          onBack={() => setStep("course")}
          isLoading={loadingModules || loadingSections || loadingSessions}
        />
      )}

      {step === "method" && (
        <>
          <MethodStep
            sel={sel}
            setSel={setSel}
            onNext={handleStartSession}
            onBack={() => setStep("session-setup")}
            isLoading={isOpening}
          />
          {startError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {startError}
            </div>
          )}
        </>
      )}

      {step === "live" && backendSessionId && (
        <LiveSession
          sel={sel}
          offering={offering}
          selectedModule={selectedModule}
          section={section}
          enrollments={enrollments}
          backendSessionId={backendSessionId}
          attendances={liveAttendances ?? []}
          onClose={handleClose}
          isClosing={isClosing}
        />
      )}
    </div>
  );
}
