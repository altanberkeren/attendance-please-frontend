/**
 * Mock / demo data used when the backend returns no data for the current user.
 * All IDs are chosen to be out of range of real backend IDs:
 *   - Offering IDs: 9001-9003
 *   - Session IDs:  8001-8006
 *   - Module IDs:   100-399 (100-199 → 9001, 200-299 → 9002, 300-399 → 9003)
 */

import type {
  CourseOfferingDto,
  SectionDto,
  ModuleDto,
  SessionDto,
  EnrollmentDto,
  AttendanceMatrixResult,
} from "@/lib/api/model"
import { AttendanceMethod, AttendanceStatus } from "@/lib/api/model"

// ── Offerings ─────────────────────────────────────────────────────────────────

export const MOCK_OFFERINGS: CourseOfferingDto[] = [
  { id: 9001, courseId: 1, courseCode: "CS101", courseTitle: "Introduction to Computer Science", termId: 1, termCode: "Spring 2025", note: null, createdAt: "2025-01-01T00:00:00Z" },
  { id: 9002, courseId: 2, courseCode: "CS301", courseTitle: "Algorithms",                       termId: 1, termCode: "Spring 2025", note: null, createdAt: "2025-01-01T00:00:00Z" },
  { id: 9003, courseId: 3, courseCode: "CS201", courseTitle: "Data Structures",                  termId: 1, termCode: "Spring 2025", note: null, createdAt: "2025-01-01T00:00:00Z" },
]

// ── Sections ──────────────────────────────────────────────────────────────────

export const MOCK_SECTIONS: Record<string, SectionDto[]> = {
  "9001": [
    { id: 11, courseOfferingId: 9001, name: "Section A", createdAt: "2025-01-01T00:00:00Z" },
    { id: 12, courseOfferingId: 9001, name: "Section B", createdAt: "2025-01-01T00:00:00Z" },
  ],
  "9002": [
    { id: 21, courseOfferingId: 9002, name: "Section A", createdAt: "2025-01-01T00:00:00Z" },
  ],
  "9003": [
    { id: 31, courseOfferingId: 9003, name: "Section A", createdAt: "2025-01-01T00:00:00Z" },
    { id: 32, courseOfferingId: 9003, name: "Section B", createdAt: "2025-01-01T00:00:00Z" },
  ],
}

// ── Modules ───────────────────────────────────────────────────────────────────

export const MOCK_MODULES: Record<string, ModuleDto[]> = {
  "9001": [
    { id: 101, courseOfferingId: 9001, title: "Module 1: Introduction",       orderIndex: 1, createdAt: "2025-01-01T00:00:00Z" },
    { id: 102, courseOfferingId: 9001, title: "Module 2: Variables & Types",   orderIndex: 2, createdAt: "2025-01-01T00:00:00Z" },
    { id: 103, courseOfferingId: 9001, title: "Module 3: Functions",           orderIndex: 3, createdAt: "2025-01-01T00:00:00Z" },
    { id: 104, courseOfferingId: 9001, title: "Module 4: Loops & Iteration",   orderIndex: 4, createdAt: "2025-01-01T00:00:00Z" },
    { id: 105, courseOfferingId: 9001, title: "Module 5: Arrays",              orderIndex: 5, createdAt: "2025-01-01T00:00:00Z" },
    { id: 106, courseOfferingId: 9001, title: "Module 6: Object-Oriented",     orderIndex: 6, createdAt: "2025-01-01T00:00:00Z" },
  ],
  "9002": [
    { id: 201, courseOfferingId: 9002, title: "Module 1: Big O Notation",      orderIndex: 1, createdAt: "2025-01-01T00:00:00Z" },
    { id: 202, courseOfferingId: 9002, title: "Module 2: Sorting Algorithms",  orderIndex: 2, createdAt: "2025-01-01T00:00:00Z" },
    { id: 203, courseOfferingId: 9002, title: "Module 3: Graph Algorithms",    orderIndex: 3, createdAt: "2025-01-01T00:00:00Z" },
    { id: 204, courseOfferingId: 9002, title: "Module 4: Dynamic Programming", orderIndex: 4, createdAt: "2025-01-01T00:00:00Z" },
  ],
  "9003": [
    { id: 301, courseOfferingId: 9003, title: "Module 1: Arrays & Lists",      orderIndex: 1, createdAt: "2025-01-01T00:00:00Z" },
    { id: 302, courseOfferingId: 9003, title: "Module 2: Stacks & Queues",     orderIndex: 2, createdAt: "2025-01-01T00:00:00Z" },
    { id: 303, courseOfferingId: 9003, title: "Module 3: Trees",               orderIndex: 3, createdAt: "2025-01-01T00:00:00Z" },
    { id: 304, courseOfferingId: 9003, title: "Module 4: Hash Tables",         orderIndex: 4, createdAt: "2025-01-01T00:00:00Z" },
  ],
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export const MOCK_SESSIONS: SessionDto[] = [
  { id: 8001, moduleId: 101, moduleTitle: "Module 1: Introduction",       sectionId: 11, sectionName: "Section A", status: "Closed", selectedMethod: AttendanceMethod.Qr,     openedByUserId: 1, openedByUserName: "Demo Instructor", openedAt: "2025-03-01T09:00:00Z", closedAt: "2025-03-01T09:50:00Z", createdAt: "2025-03-01T09:00:00Z" },
  { id: 8002, moduleId: 101, moduleTitle: "Module 1: Introduction",       sectionId: 12, sectionName: "Section B", status: "Closed", selectedMethod: AttendanceMethod.Qr,     openedByUserId: 1, openedByUserName: "Demo Instructor", openedAt: "2025-03-01T11:00:00Z", closedAt: "2025-03-01T11:50:00Z", createdAt: "2025-03-01T11:00:00Z" },
  { id: 8003, moduleId: 102, moduleTitle: "Module 2: Variables & Types",  sectionId: 11, sectionName: "Section A", status: "Closed", selectedMethod: AttendanceMethod.QrWifi, openedByUserId: 1, openedByUserName: "Demo Instructor", openedAt: "2025-03-08T09:00:00Z", closedAt: "2025-03-08T09:50:00Z", createdAt: "2025-03-08T09:00:00Z" },
  { id: 8004, moduleId: 201, moduleTitle: "Module 1: Big O Notation",     sectionId: 21, sectionName: "Section A", status: "Closed", selectedMethod: AttendanceMethod.Nfc,    openedByUserId: 1, openedByUserName: "Demo Instructor", openedAt: "2025-03-03T13:00:00Z", closedAt: "2025-03-03T13:50:00Z", createdAt: "2025-03-03T13:00:00Z" },
  { id: 8005, moduleId: 301, moduleTitle: "Module 1: Arrays & Lists",     sectionId: 31, sectionName: "Section A", status: "Closed", selectedMethod: AttendanceMethod.Qr,     openedByUserId: 1, openedByUserName: "Demo Instructor", openedAt: "2025-03-05T10:00:00Z", closedAt: "2025-03-05T10:50:00Z", createdAt: "2025-03-05T10:00:00Z" },
  { id: 8006, moduleId: 202, moduleTitle: "Module 2: Sorting Algorithms", sectionId: 21, sectionName: "Section A", status: "Closed", selectedMethod: AttendanceMethod.Qr,     openedByUserId: 1, openedByUserName: "Demo Instructor", openedAt: "2025-03-10T13:00:00Z", closedAt: "2025-03-10T13:50:00Z", createdAt: "2025-03-10T13:00:00Z" },
]

// ── Student names pool (45) ───────────────────────────────────────────────────

const MOCK_NAMES = [
  "Aisha Rahman",     "Benjamin Carter",  "Chloe Mitchell",   "Daniel Okonkwo",   "Elena Vasquez",
  "Faisal Al-Amin",   "Grace Kim",        "Hassan Yilmaz",    "Isabella Rossi",   "Jayden Brooks",
  "Kiran Patel",      "Lena Hoffmann",    "Marcus Thompson",  "Nadia Sokolova",   "Oliver Chen",
  "Priya Sharma",     "Quincy Adams",     "Rosa Fernandez",   "Samuel Adeyemi",   "Tina Nguyen",
  "Umar Farooq",      "Valentina Cruz",   "William Johansson","Xia Liu",          "Yasmine Larabi",
  "Zain Malik",       "Anna Petrova",     "Bruno Silva",      "Carmen Diaz",      "David Park",
  "Emma Laurent",     "Felix Becker",     "Giulia Romano",    "Hamid Reza",       "Ines Dupont",
  "Jakub Novak",      "Katerina Ivanova", "Luca Esposito",    "Mia Andersen",     "Nour Khalil",
  "Oscar Lindqvist",  "Paula Ribeiro",    "Reza Tehrani",     "Sofia Magnusson",  "Tariq Osei",
]

// ── Enrollment generator ──────────────────────────────────────────────────────

export function makeMockEnrollments(
  offeringId: number,
  sections: SectionDto[],
  count = 45,
): EnrollmentDto[] {
  if (!sections.length) return []
  const now = "2025-01-15T00:00:00Z"
  return Array.from({ length: count }, (_, i) => {
    const sec = sections[i % sections.length]
    return {
      id:               10000 + i,
      userId:           20000 + i,
      userName:         MOCK_NAMES[i % MOCK_NAMES.length],
      courseOfferingId: offeringId,
      sectionId:        sec.id,
      sectionName:      sec.name,
      createdAt:        now,
    }
  })
}

// ── Attendance matrix generator ───────────────────────────────────────────────

export function makeMockMatrix(offeringId: number): AttendanceMatrixResult {
  const modules  = MOCK_MODULES[String(offeringId)] ?? []
  const sections = MOCK_SECTIONS[String(offeringId)] ?? []
  const enrollments = makeMockEnrollments(offeringId, sections, 45)

  const coveredModules = modules.slice(0, Math.ceil(modules.length * 0.6))

  return {
    modules: coveredModules.map(m => ({
      moduleId:   m.id,
      title:      m.title,
      orderIndex: m.orderIndex,
    })),
    students: enrollments.map(e => ({
      studentId:          e.userId,
      studentName:        e.userName,
      currentSectionId:   e.sectionId,
      currentSectionName: e.sectionName,
      attendanceStatuses: coveredModules.map((_, i) => {
        const hash = (Number(e.userId) * 31 + i * 17) % 10
        if (hash < 7) return AttendanceStatus.Present
        if (hash < 8) return AttendanceStatus.Late
        if (hash < 9) return AttendanceStatus.Absent
        return AttendanceStatus.Excused
      }),
    })),
  }
}
