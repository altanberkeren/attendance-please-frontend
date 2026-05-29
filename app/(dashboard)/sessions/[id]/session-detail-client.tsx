"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Nfc,
  QrCode,
  RefreshCw,
  StopCircle,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useState } from "react";
import { AttendanceRoster } from "@/components/attendance-roster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetApiAttendancesSessionSessionId } from "@/lib/api/attendances/attendances";
import { useGetApiEnrollments } from "@/lib/api/enrollments/enrollments";
import type { SessionDto } from "@/lib/api/model";
import { AttendanceMethod, AttendanceStatus } from "@/lib/api/model";
import { useGetApiModulesId } from "@/lib/api/modules/modules";
import {
  useGetApiSessions,
  usePostApiSessionsIdClose,
} from "@/lib/api/sessions/sessions";
import {
  MOCK_SECTIONS,
  MOCK_SESSIONS,
  makeMockEnrollments,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function methodIcon(method: string) {
  if (method === AttendanceMethod.QrWifi)
    return <Wifi className="h-3.5 w-3.5" />;
  if (method === AttendanceMethod.Nfc) return <Nfc className="h-3.5 w-3.5" />;
  return <QrCode className="h-3.5 w-3.5" />;
}

function methodLabel(method: string) {
  if (method === AttendanceMethod.QrWifi) return "QR + WiFi";
  if (method === AttendanceMethod.Nfc) return "NFC";
  if (method === AttendanceMethod.Manual) return "Manual";
  return "QR Code";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcDuration(openedAt: string, closedAt: string | null) {
  if (!closedAt) return "Ongoing";
  const mins = Math.round(
    (new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 60000,
  );
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function textColor(v: number) {
  return v >= 80
    ? "text-primary"
    : v >= 60
      ? "text-amber-500"
      : "text-destructive";
}

function SessionDetail({ session }: { session: SessionDto }) {
  const router = useRouter();
  const duration = calcDuration(session.openedAt, session.closedAt);
  const mockMode = Number(session.id) >= 8000;
  const isOpen = session.status === "Open";
  const [qrToken, setQrToken] = useState(
    () => `att://session/${session.id}?ts=${Date.now()}`,
  );
  const { mutateAsync: closeSession, isPending: isClosing } =
    usePostApiSessionsIdClose();

  const { data: attendances = [], isLoading: loadingAtt } =
    useGetApiAttendancesSessionSessionId(session.id, {
      query: { enabled: !mockMode, refetchInterval: isOpen ? 3000 : false },
    });
  const { data: moduleData } = useGetApiModulesId(session.moduleId, {
    query: { enabled: !mockMode },
  });
  const { data: apiEnrollments = [], isLoading: loadingEnroll } =
    useGetApiEnrollments(
      { courseOfferingId: moduleData?.courseOfferingId },
      { query: { enabled: !!moduleData?.courseOfferingId && !mockMode } },
    );

  const mid = Number(session.moduleId);
  const mockOfferingId =
    mid >= 100 && mid < 200 ? 9001 : mid >= 200 && mid < 300 ? 9002 : 9003;
  const mockSections = MOCK_SECTIONS[String(mockOfferingId)] ?? [];
  const enrollments = mockMode
    ? makeMockEnrollments(mockOfferingId, mockSections, 45)
    : apiEnrollments;
  const sectionEnrollments = session.sectionId
    ? enrollments.filter(
        (enrollment) =>
          String(enrollment.sectionId) === String(session.sectionId),
      )
    : enrollments;

  const presentAtts = attendances.filter(
    (attendance) =>
      attendance.status === AttendanceStatus.Present ||
      attendance.status === AttendanceStatus.Late,
  );
  const presentIds = new Set(
    presentAtts.map((attendance) => String(attendance.userId)),
  );
  const presentList = mockMode
    ? sectionEnrollments
        .slice(0, Math.round(sectionEnrollments.length * 0.83))
        .map((enrollment) => ({
          id: enrollment.userId,
          name: enrollment.userName,
          studentId: String(enrollment.userId),
          via: "auto" as const,
        }))
    : presentAtts.map((attendance) => ({
        id: attendance.userId,
        name: attendance.userName,
        studentId: String(attendance.userId),
        via:
          attendance.method === AttendanceMethod.Manual
            ? ("manual" as const)
            : ("auto" as const),
        markedAt: attendance.recordedAt ?? undefined,
      }));

  const presentMockIds = new Set(
    presentList.map((student) => String(student.id)),
  );
  const absentList = sectionEnrollments
    .filter((enrollment) =>
      mockMode
        ? !presentMockIds.has(String(enrollment.userId))
        : !presentIds.has(String(enrollment.userId)),
    )
    .map((enrollment) => ({
      id: enrollment.userId,
      name: enrollment.userName,
      studentId: String(enrollment.userId),
    }));

  const total = presentList.length + absentList.length;
  const pct = total > 0 ? Math.round((presentList.length / total) * 100) : 0;
  const isLoading = loadingAtt || loadingEnroll;

  function refreshQR() {
    setQrToken(`att://session/${session.id}?ts=${Date.now()}`);
  }

  function openQRTab() {
    const params = new URLSearchParams({
      t: qrToken,
      m: session.moduleTitle,
      s: session.sectionName ?? "",
    });
    window.open(`/qr?${params}`, "_blank", "noopener");
  }

  async function handleEndSession() {
    if (mockMode) return;
    await closeSession({ id: session.id });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-screen-md space-y-6">
      <button type="button"
        onClick={() => router.push("/attendance")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to attendance
      </button>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">{session.moduleTitle}</h1>
              {session.sectionName && (
                <p className="text-sm text-muted-foreground">
                  {session.sectionName}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                By {session.openedByUserName}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant="outline" className="gap-1.5">
                {methodIcon(session.selectedMethod)}
                {methodLabel(session.selectedMethod)}
              </Badge>
              <Badge variant={isOpen ? "default" : "secondary"}>
                {isOpen ? "Open" : "Completed"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Date", value: fmtDate(session.openedAt) },
              { label: "Time", value: fmtTime(session.openedAt) },
              { label: "Duration", value: duration },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {!isLoading && total > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {presentList.length} present
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" />
                {absentList.length} absent
              </div>
              <span
                className={cn(
                  "ml-auto text-xs font-bold tabular-nums",
                  textColor(pct),
                )}
              >
                {pct}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {isOpen && (
        <Card>
          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border bg-card p-5 md:col-span-3">
                {(session.selectedMethod === AttendanceMethod.Qr ||
                  session.selectedMethod === AttendanceMethod.QrWifi) && (
                  <>
                    {session.selectedMethod === AttendanceMethod.QrWifi && (
                      <div className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs text-blue-500">
                        <Wifi className="h-3.5 w-3.5" />
                        Campus WiFi:{" "}
                        <strong className="ml-1 font-mono">IUS-Campus</strong>
                      </div>
                    )}
                    <div className="rounded-2xl border bg-white p-3.5 shadow">
                      <QRCode
                        value={qrToken}
                        size={155}
                        level="M"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="button"
                        onClick={refreshQR}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Refresh
                      </button>
                      <button type="button"
                        onClick={openQRTab}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Project QR
                      </button>
                    </div>
                  </>
                )}

                {session.selectedMethod === AttendanceMethod.Nfc && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-28 w-28 items-center justify-center">
                      <div
                        className="absolute inset-0 animate-ping rounded-full border-2 border-violet-500/15"
                        style={{ animationDuration: "2s" }}
                      />
                      <div className="absolute inset-4 animate-pulse rounded-full border border-violet-500/25" />
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10">
                        <Nfc className="h-7 w-7 text-violet-500" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">Waiting for taps</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Students tap their student card
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border bg-card md:col-span-2">
                <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Live Attendance
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {presentList.length}/{sectionEnrollments.length}
                  </span>
                </div>
                <div className="max-h-72 divide-y overflow-y-auto">
                  {presentList.map((student) => (
                    <div
                      key={String(student.id)}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate text-xs font-medium">
                        {student.name}
                      </span>
                    </div>
                  ))}
                  {absentList.map((student) => (
                    <div
                      key={String(student.id)}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      <span className="truncate text-xs text-muted-foreground">
                        {student.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndSession}
                disabled={isClosing || mockMode}
                className="gap-2"
              >
                {isClosing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4" />
                )}
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-primary" />
          Attendance
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AttendanceRoster
            present={presentList}
            absent={absentList}
            mode="full"
          />
        )}
      </div>
    </div>
  );
}

export function SessionDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: apiSessions = [], isLoading } = useGetApiSessions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sessions = apiSessions.length > 0 ? apiSessions : MOCK_SESSIONS;
  const session = sessions.find((item) => String(item.id) === id);

  if (!session) {
    return (
      <div className="mx-auto max-w-screen-md space-y-4">
        <button type="button"
          onClick={() => router.push("/attendance")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to attendance
        </button>
        <p className="text-sm text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  return <SessionDetail session={session} />;
}
