import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Library,
  QrCode,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

export const UNIVERSITY_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "https://www.ius.edu.ba/en" },
  { label: "About IUS", href: "https://www.ius.edu.ba/en/about-university" },
  { label: "Admission", href: "https://www.ius.edu.ba/en/admission" },
  { label: "Academic", href: "https://www.ius.edu.ba/en/academic-units" },
  { label: "Research", href: "https://www.ius.edu.ba/en/research" },
  { label: "Contact", href: "https://www.ius.edu.ba/en/contact" },
]

export const PLATFORM_LINKS: { label: string; href: string }[] = [
  { label: "Platform", href: "#platform" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
]

export const FEATURES: {
  icon: LucideIcon
  title: string
  description: string
}[] = [
  {
    icon: QrCode,
    title: "Verified QR Check-In",
    description:
      "Students record attendance with rotating codes tied to live class sessions and their university accounts.",
  },
  {
    icon: CalendarCheck,
    title: "Course Session Control",
    description:
      "Instructors open, monitor, and close sessions with full course, section, and term context at hand.",
  },
  {
    icon: ShieldCheck,
    title: "Institutional Access",
    description:
      "Role-aware permissions keep student, instructor, and administrative views on the right academic data.",
  },
  {
    icon: BarChart3,
    title: "Academic Reporting",
    description:
      "Attendance records compile for review, export, advising, and departmental follow-up.",
  },
]

export const WORKFLOW: { step: string; title: string; text: string }[] = [
  {
    step: "01",
    title: "Prepare the class",
    text: "Select the course offering, section, and module before the lecture begins.",
  },
  {
    step: "02",
    title: "Open attendance",
    text: "Display the live QR code; verified students check in from their own devices.",
  },
  {
    step: "03",
    title: "Review the record",
    text: "Follow attendance in real time, then export or audit it whenever needed.",
  },
]

export const STATS: [string, string][] = [
  ["2,400+", "Students"],
  ["120+", "Live courses"],
  ["12", "Faculties"],
  ["< 2s", "Per check-in"],
]

export const CAMPUS_POINTS: string[] = [
  "Bologna Standards & ECTS",
  "International, Multilingual Campus",
  "Academic & Career Advising",
  "Erasmus+ Student Exchange",
]

export const QUICK_LINKS: { icon: LucideIcon; label: string; note: string }[] = [
  { icon: GraduationCap, label: "Students", note: "Check in & history" },
  { icon: BookOpen, label: "Instructors", note: "Run a session" },
  { icon: Library, label: "Administration", note: "Reports & audit" },
]

export const CONTACT = {
  address: "Hrasnička cesta 15, 71210 Ilidža, Sarajevo",
  phone: "+387 33 957 101",
  email: "info@ius.edu.ba",
  university: "International University of Sarajevo",
  motto: "We Value What is Important",
  tagline: "Be Among the Best · Be IUS",
}
