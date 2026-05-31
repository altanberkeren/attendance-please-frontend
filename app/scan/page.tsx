"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  LockKeyhole,
  MapPin,
  QrCode,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetApiAttendancesScanPreview,
  usePostApiAttendancesScan,
} from "@/lib/api/attendances/attendances";
import { SessionStatus } from "@/lib/api/model";
import {
  extractStudentIdFromEmail,
  getUniversityAccountType,
} from "@/lib/auth/university-account";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const candidate = error as Error & {
      response?: { data?: { detail?: string; title?: string } };
    };
    return (
      candidate.response?.data?.detail ??
      candidate.response?.data?.title ??
      candidate.message
    );
  }

  return "Attendance check-in failed.";
}

function StepShell({
  number,
  title,
  icon,
  state,
  titleClassName,
  children,
}: {
  number: number;
  title?: ReactNode;
  titleClassName?: string;
  icon: ReactNode;
  state: "done" | "current" | "locked" | "error";
  children: ReactNode;
}) {
  return (
    <div className="relative grid grid-cols-[2.75rem_1fr] gap-3">
      {number < 3 ? (
        <div className="absolute left-[1.35rem] top-11 h-[calc(100%-1.75rem)] w-px bg-border" />
      ) : null}
      <div
        className={cn(
          "relative z-10 grid h-11 w-11 place-items-center rounded-full border text-sm font-bold shadow-sm",
          state === "done" && "border-emerald-500 bg-emerald-500 text-white",
          state === "current" && "border-primary bg-primary text-primary-foreground",
          state === "locked" && "border-border bg-muted text-muted-foreground",
          state === "error" && "border-destructive bg-destructive text-destructive-foreground",
        )}
      >
        {state === "done" ? <CheckCircle2 className="h-5 w-5" /> : number}
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          {title ? (
            <div className="mb-3 flex items-center gap-2">
              <div className="text-muted-foreground">{icon}</div>
              <h2 className={cn("font-semibold tracking-tight", titleClassName)}>{title}</h2>
            </div>
          ) : null}
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ScanPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = searchParams.get("t") ?? "";
  const { isAuthenticated, isReady, isExchanging, signIn, user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "getting" | "ok" | "failed">("idle");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const returnTo = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const accountType = getUniversityAccountType(user?.email ?? "");
  const studentId = extractStudentIdFromEmail(user?.email ?? "");

  const previewQuery = useGetApiAttendancesScanPreview(
    { token },
    { query: { enabled: !!token } },
  );

  const scanMutation = usePostApiAttendancesScan();
  const preview = previewQuery.data;
  const courseHeading = preview
    ? [preview.courseCode, preview.courseTitle].filter(Boolean).join(" · ") ||
      preview.moduleTitle ||
      "Class information"
    : "Class information";
  const canUseIdentity = isReady && isAuthenticated && accountType === "student";
  const attendanceDone = submitted || !!preview?.alreadyRecorded;
  const canSign = !!token && !!preview?.canSign && canUseIdentity && !attendanceDone;
  const infoState = !token || (preview && !preview.canSign && !preview.alreadyRecorded && preview.status !== SessionStatus.Open)
    ? "error"
    : "done";
  const identityState = canUseIdentity
    ? "done"
    : preview?.canSign
      ? "current"
      : "locked";
  const signState = attendanceDone ? "done" : canSign ? "current" : "locked";

  useEffect(() => {
    if (canUseIdentity && token) {
      void previewQuery.refetch();
    }
  }, [canUseIdentity, previewQuery.refetch, token]);

  async function handleSign() {
    setMessage(null);

    if (!token) {
      setMessage("Invalid QR link. Ask your instructor for a fresh code.");
      return;
    }

    // Try to get GPS location (best-effort, not blocking)
    let studentLatitude: number | null = null;
    let studentLongitude: number | null = null;

    if (navigator.geolocation) {
      setGpsStatus("getting");
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          }),
        );
        studentLatitude = position.coords.latitude;
        studentLongitude = position.coords.longitude;
        setGpsCoords({ lat: studentLatitude, lng: studentLongitude });
        setGpsStatus("ok");
      } catch {
        setGpsStatus("failed");
        // Continue without GPS — the backend will decide whether to reject
      }
    }

    try {
      const result = await scanMutation.mutateAsync({
        data: {
          token,
          studentLatitude,
          studentLongitude,
        },
      });
      setSubmitted(result.success);
      setMessage(result.message || "Attendance submitted successfully.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.13),_transparent_34rem),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.45))] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-xl space-y-5">
        <header className="space-y-3 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border bg-background shadow-sm">
            <QrCode className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              AttendancePlease
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Check in to class
            </h1>
          </div>
        </header>

        <div className="space-y-4">
          <StepShell
            number={1}
            title={courseHeading}
            titleClassName="text-2xl font-black leading-tight sm:text-3xl"
            icon={<QrCode className="h-4 w-4" />}
            state={infoState}
          >
            {!token ? (
              <div className="flex gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>This QR link is missing its secure token.</p>
              </div>
            ) : previewQuery.isLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading class information…
              </p>
            ) : preview ? (
              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-muted-foreground">
                    {preview.moduleTitle}
                  </p>
                  {preview.sectionName ? (
                    <p className="text-sm text-muted-foreground/80">
                      {preview.sectionName}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {preview.openedByUserName || "Instructor"} · opened {new Date(preview.openedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <Badge
                  variant={preview.status === SessionStatus.Open ? "default" : "secondary"}
                  className="gap-1.5"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  {preview.message}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-destructive">
                Could not read this QR code. Ask your instructor to refresh it.
              </p>
            )}
          </StepShell>

          <StepShell
            number={2}
            title="Identity"
            icon={<UserRound className="h-4 w-4" />}
            state={identityState}
          >
            {!isReady ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure sign-in…
              </p>
            ) : !isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Use your IUS Microsoft student account. You will return to this check-in after signing in.
                </p>
                <Button className="w-full" onClick={() => signIn(returnTo)}>
                  Sign in with Microsoft
                </Button>
              </div>
            ) : isExchanging ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Completing backend sign-in…
              </p>
            ) : accountType !== "student" ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Student account required</p>
                <p>Signed in as {user?.email}</p>
                <Link href="/overview" className="underline">
                  Go to dashboard
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/35 p-3 text-sm">
                <p className="font-semibold">{user?.displayName}</p>
                <p className="text-muted-foreground">{user?.email}</p>
                {studentId ? (
                  <p className="text-muted-foreground">Student ID: {studentId}</p>
                ) : null}
              </div>
            )}
          </StepShell>

          <StepShell
            number={3}
            title="Sign"
            icon={<ShieldCheck className="h-4 w-4" />}
            state={signState}
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {attendanceDone
                  ? "You are checked in. You can close this page."
                  : canSign
                    ? "Everything is ready. Sign now to record your attendance."
                    : "Complete the previous steps before signing attendance."}
              </p>

              {/* GPS status indicator */}
              {canSign && !attendanceDone && (
                <div className="flex items-center gap-2 text-xs">
                  {gpsStatus === "idle" && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Location will be captured when you sign
                    </span>
                  )}
                  {gpsStatus === "getting" && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Getting your location...
                    </span>
                  )}
                  {gpsStatus === "ok" && gpsCoords && (
                    <span className="flex items-center gap-1.5 text-primary">
                      <MapPin className="h-3.5 w-3.5" />
                      Location captured ({gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)})
                    </span>
                  )}
                  {gpsStatus === "failed" && (
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <MapPin className="h-3.5 w-3.5" />
                      Location unavailable — attendance may be restricted
                    </span>
                  )}
                </div>
              )}

              <Button
                className="w-full gap-2"
                onClick={() => void handleSign()}
                disabled={!canSign || scanMutation.isPending || attendanceDone}
              >
                {scanMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : attendanceDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <LockKeyhole className="h-4 w-4" />
                )}
                {scanMutation.isPending
                  ? "Signing…"
                  : attendanceDone
                    ? "Attendance signed"
                    : "Sign attendance"}
              </Button>
              {message ? (
                <p
                  className={cn(
                    "flex items-start gap-2 text-sm",
                    attendanceDone ? "text-emerald-600" : "text-muted-foreground",
                  )}
                >
                  {attendanceDone ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  ) : null}
                  <span>{message}</span>
                </p>
              ) : null}
            </div>
          </StepShell>
        </div>
      </div>
    </main>
  );
}
