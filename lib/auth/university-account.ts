export type UniversityAccountType = "student" | "staff" | "external"

const STUDENT_SUFFIX = "@student.ius.edu.ba"
const STAFF_SUFFIX = "@ius.edu.ba"

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function isUniversityEmail(value: string): boolean {
  return value.endsWith(STUDENT_SUFFIX) || value.endsWith(STAFF_SUFFIX)
}

export function getUniversityAccountType(email: string): UniversityAccountType {
  const normalized = normalizeEmail(email)

  if (normalized.endsWith(STUDENT_SUFFIX)) {
    return "student"
  }

  if (normalized.endsWith(STAFF_SUFFIX)) {
    return "staff"
  }

  return "external"
}

export function extractStudentIdFromEmail(email: string): string | null {
  const normalized = normalizeEmail(email)
  if (!normalized.endsWith(STUDENT_SUFFIX)) {
    return null
  }

  const id = normalized.slice(0, normalized.indexOf("@"))
  return id.length > 0 ? id : null
}

export function extractUniversityEmailFromClaims(
  claims: Record<string, unknown> | null | undefined,
  fallback: string,
): string {
  const candidateValues: unknown[] = [
    claims?.preferred_username,
    claims?.upn,
    claims?.email,
    claims?.unique_name,
    fallback,
  ]

  for (const value of candidateValues) {
    if (typeof value !== "string") {
      continue
    }

    const normalized = normalizeEmail(value)
    if (normalized && isUniversityEmail(normalized)) {
      return normalized
    }
  }

  return normalizeEmail(fallback)
}
