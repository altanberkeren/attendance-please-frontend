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
import { useCallback, useEffect, useState } from "react";
import { AttendanceRoster } from "@/components/attendance-roster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetApiAttendancesSessionSessionId } from "@/lib/api/attendances/attendances";
import { useGetApiCourseOfferingsId } from "@/lib/api/course-offerings/course-offerings";
import { useGetApiEnrollments } from "@/lib/api/enrollments/enrollments";
import type { SessionDto } from "@/lib/api/model";
import { AttendanceMethod, AttendanceStatus } from "@/lib/api/model";
import { useGetApiModulesId } from "@/lib/api/modules/modules";
import {
  useGetApiSessionsId,
  usePostApiSessionsIdClose,
  usePostApiSessionsIdScanToken,
} from "@/lib/api/sessions/sessions";
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

function SessionDetail({
  session,
  projectQr = false,
}: {
  session: SessionDto;
  projectQr?: boolean;
}) {
  const router = useRouter();
  const duration = calcDuration(session.openedAt, session.closedAt);
  const isOpen = session.status === "Open";
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const { mutateAsync: closeSession, isPending: isClosing } =
    usePostApiSessionsIdClose();
  const { mutateAsync: createScanToken, isPending: isCreatingScanToken } =
    usePostApiSessionsIdScanToken();

  const { data: attendances = [], isLoading: loadingAtt } =
    useGetApiAttendancesSessionSessionId(session.id, {
      query: { refetchInterval: isOpen ? 3000 : false },
    });
  const { data: moduleData } = useGetApiModulesId(session.moduleId);
  const { data: offering } = useGetApiCourseOfferingsId(
    moduleData?.courseOfferingId ?? "",
    { query: { enabled: !!moduleData?.courseOfferingId } },
  );
  const { data: enrollments = [], isLoading: loadingEnroll } =
    useGetApiEnrollments(
      { courseOfferingId: moduleData?.courseOfferingId },
      { query: { enabled: !!moduleData?.courseOfferingId } },
    );
  const linkedEnrollments = enrollments.filter((enrollment) => enrollment.userId != null);
  const sectionEnrollments = session.sectionId
    ? linkedEnrollments.filter(
        (enrollment) =>
          String(enrollment.sectionId) === String(session.sectionId),
      )
    : linkedEnrollments;

  const presentAtts = attendances.filter(
    (attendance) =>
      attendance.status === AttendanceStatus.Present ||
      attendance.status === AttendanceStatus.Late,
  );
  const presentIds = new Set(
    presentAtts.map((attendance) => String(attendance.userId)),
  );
  const presentList = presentAtts.map((attendance) => ({
    id: attendance.userId,
    name: attendance.userName,
    studentId: String(attendance.userId),
    via:
      attendance.method === AttendanceMethod.Manual
        ? ("manual" as const)
        : ("auto" as const),
    markedAt: attendance.recordedAt ?? undefined,
  }));

  const absentList = sectionEnrollments.flatMap((enrollment) => {
    if (enrollment.userId == null || presentIds.has(String(enrollment.userId))) {
      return [];
    }

    return [
      {
        id: enrollment.userId,
        name: enrollment.userName,
        studentId: String(enrollment.userId),
      },
    ];
  });

  const total = presentList.length + absentList.length;
  const pct = total > 0 ? Math.round((presentList.length / total) * 100) : 0;
  const isLoading = loadingAtt || loadingEnroll;

  const refreshQR = useCallback(async () => {
    const result = await createScanToken({ id: session.id });
    const origin = window.location.origin;
    setQrUrl(`${origin}/scan?t=${encodeURIComponent(result.token)}`);
  }, [createScanToken, session.id]);

  useEffect(() => {
    if (isOpen && (session.selectedMethod === AttendanceMethod.Qr || session.selectedMethod === AttendanceMethod.QrWifi)) {
      void refreshQR();
      const id = window.setInterval(() => void refreshQR(), 240_000);
      return () => window.clearInterval(id);
    }
  }, [isOpen, refreshQR, session.selectedMethod]);

  function openQRTab() {
    window.open(
      `/project-qr?id=${encodeURIComponent(String(session.id))}&courseOfferingId=${encodeURIComponent(String(moduleData?.courseOfferingId ?? ""))}`,
      "_blank",
      "noopener",
    );
  }

  async function handleEndSession() {
    await closeSession({ id: session.id });
    router.refresh();
  }

  if (projectQr) {
    const qrSize = 460;
    return (
      <main className="relative grid min-h-[100dvh] overflow-hidden bg-[#050505] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_8%_8%,rgba(34,197,94,0.18),transparent_28%),radial-gradient(circle_at_92%_86%,rgba(59,130,246,0.16),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:64px_64px]" />

        <section className="relative z-10 grid min-h-[100dvh] place-items-center p-8">
          <div className="flex flex-col items-center gap-8">
            <div className="rounded-[2rem] border border-white/10 bg-white p-7 shadow-[0_40px_140px_rgba(0,0,0,0.85),0_0_80px_rgba(255,255,255,0.10)]">
              {qrUrl ? (
                <QRCode value={qrUrl} size={qrSize} level="M" />
              ) : (
                <div className="grid h-[460px] w-[460px] place-items-center">
                  <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
                </div>
              )}
            </div>

            <div className="max-w-5xl text-center">
              <div className="mb-3 font-mono text-2xl font-black uppercase tracking-[0.22em] text-white">
                {offering?.courseCode ?? "Course"}
              </div>
              <div className="text-4xl font-semibold tracking-tight text-white/90">
                {session.moduleTitle}
              </div>
              {session.sectionName ? (
                <div className="mt-3 text-2xl text-white/55">{session.sectionName}</div>
              ) : null}
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 font-mono text-xs uppercase tracking-[0.28em] text-white/45 backdrop-blur">
            Scan to mark attendance
          </div>
        </section>
      </main>
    );
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
                    <div className="grid h-[185px] w-[185px] place-items-center rounded-2xl border bg-white p-3.5 shadow">
                      {qrUrl ? (
                        <QRCode
                          value={qrUrl}
                          size={155}
                          level="M"
                        />
                      ) : (
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="button"
                        onClick={() => void refreshQR()}
                        disabled={isCreatingScanToken}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                      >
                        <RefreshCw className={cn("h-3 w-3", isCreatingScanToken && "animate-spin")} />
                        Refresh secure QR
                      </button>
                      <button type="button"
                        onClick={openQRTab}
                        disabled={!qrUrl}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
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
                disabled={isClosing}
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

export function SessionDetailClient({
  id,
  projectQr = false,
}: {
  id: string;
  projectQr?: boolean;
}) {
  const router = useRouter();
  const { data: session, isLoading } = useGetApiSessionsId(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  return <SessionDetail session={session} projectQr={projectQr} />;
}
