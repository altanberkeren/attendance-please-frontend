import { Nfc, QrCode, Wifi } from "lucide-react";
import { AttendanceMethod, AttendanceStatus } from "@/lib/api/model";

export const STATUS_STYLE: Record<string, string> = {
  [AttendanceStatus.Present]: "bg-primary/10 text-primary border-primary/20",
  [AttendanceStatus.Late]: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  [AttendanceStatus.Absent]:
    "bg-destructive/10 text-destructive border-destructive/20",
  [AttendanceStatus.Excused]: "bg-muted text-muted-foreground border-border",
};

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function methodIcon(method: string) {
  if (method === AttendanceMethod.QrWifi)
    return <Wifi className="h-3.5 w-3.5" />;
  if (method === AttendanceMethod.Nfc) return <Nfc className="h-3.5 w-3.5" />;
  return <QrCode className="h-3.5 w-3.5" />;
}

export function methodLabel(method: string) {
  if (method === AttendanceMethod.QrWifi) return "QR + WiFi";
  if (method === AttendanceMethod.Nfc) return "NFC";
  if (method === AttendanceMethod.Manual) return "Manual";
  return "QR Code";
}

export function calcDuration(openedAt: string, closedAt: string | null) {
  if (!closedAt) return "Ongoing";
  const mins = Math.round(
    (new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 60000,
  );
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function shortStatus(status: string) {
  if (status === AttendanceStatus.Present) return "P";
  if (status === AttendanceStatus.Late) return "L";
  if (status === AttendanceStatus.Absent) return "A";
  if (status === AttendanceStatus.Excused) return "E";
  return "-";
}

export function studentNumberFromEmail(email?: string | null) {
  const suffix = "@student.ius.edu.ba";
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized.endsWith(suffix)) return "";
  const local = normalized.slice(0, -suffix.length);
  return /^\d+$/.test(local) ? local : "";
}
