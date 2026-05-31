/**
 * Application-wide configuration constants.
 * Centralises values that were previously scattered as hardcoded strings.
 */

/** Campus WiFi SSID shown during QR+WiFi attendance sessions. */
export const CAMPUS_WIFI_SSID = "IUS-Campus";

/** Default column configuration for the bulk-enroll Excel parser. */
export const BULK_ENROLL_DEFAULTS = {
  startRow: "1",
  noCol: "A",
  nameCol: "B",
  surnameCol: "C",
  sectionId: "",
} as const;

/**
 * Returns a human-readable semester label for the current date.
 * Fall = Aug-Dec, Spring = Jan-May, Summer = Jun-Jul.
 */
export function getCurrentSemesterLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed

  if (month >= 8) return `Fall ${year}`;
  if (month >= 6) return `Summer ${year}`;
  return `Spring ${year}`;
}
