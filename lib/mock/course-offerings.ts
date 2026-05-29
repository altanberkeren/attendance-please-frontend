export type EnrolledStudent = {
  id: string;
  name: string;
  email: string;
  enrolledAt: string;
};

export type OfferingStaff = {
  id: string;
  name: string;
  role: string;
  email: string;
};

export type OfferingSession = {
  id: string;
  date: string;
  topic: string;
  status: "Scheduled" | "Completed" | "Cancelled";
};

export type CourseOffering = {
  id: string;
  courseId: string;
  courseName: string;
  termId: string;
  termName: string;
  section: string;
  students: EnrolledStudent[];
  staff: OfferingStaff[];
  sessions: OfferingSession[];
};

export const MOCK_COURSE_OFFERINGS: CourseOffering[] = [
  {
    id: "1",
    courseId: "1",
    courseName: "Introduction to Computer Science",
    termId: "2",
    termName: "Spring 2025",
    section: "A",
    students: [
      {
        id: "s1",
        name: "Alice Johnson",
        email: "alice@university.edu",
        enrolledAt: "2025-01-10",
      },
      {
        id: "s2",
        name: "Bob Smith",
        email: "bob@university.edu",
        enrolledAt: "2025-01-11",
      },
      {
        id: "s3",
        name: "Carol White",
        email: "carol@university.edu",
        enrolledAt: "2025-01-12",
      },
    ],
    staff: [
      {
        id: "st1",
        name: "Dr. Michael Brown",
        role: "Instructor",
        email: "m.brown@university.edu",
      },
      {
        id: "st2",
        name: "Jane Doe",
        role: "Teaching Assistant",
        email: "j.doe@university.edu",
      },
    ],
    sessions: [
      {
        id: "se1",
        date: "2025-01-20",
        topic: "Introduction & Syllabus",
        status: "Completed",
      },
      {
        id: "se2",
        date: "2025-01-27",
        topic: "Variables and Types",
        status: "Completed",
      },
      {
        id: "se3",
        date: "2025-02-03",
        topic: "Control Flow",
        status: "Scheduled",
      },
    ],
  },
  {
    id: "2",
    courseId: "2",
    courseName: "Data Structures",
    termId: "2",
    termName: "Spring 2025",
    section: "B",
    students: [
      {
        id: "s4",
        name: "David Lee",
        email: "david@university.edu",
        enrolledAt: "2025-01-10",
      },
      {
        id: "s5",
        name: "Emma Wilson",
        email: "emma@university.edu",
        enrolledAt: "2025-01-13",
      },
    ],
    staff: [
      {
        id: "st3",
        name: "Prof. Sarah Connor",
        role: "Instructor",
        email: "s.connor@university.edu",
      },
    ],
    sessions: [
      {
        id: "se4",
        date: "2025-01-21",
        topic: "Arrays and Linked Lists",
        status: "Completed",
      },
      {
        id: "se5",
        date: "2025-01-28",
        topic: "Stacks and Queues",
        status: "Scheduled",
      },
    ],
  },
  {
    id: "3",
    courseId: "3",
    courseName: "Algorithms",
    termId: "4",
    termName: "Fall 2025",
    section: "A",
    students: [
      {
        id: "s6",
        name: "Frank Miller",
        email: "frank@university.edu",
        enrolledAt: "2025-08-25",
      },
    ],
    staff: [
      {
        id: "st4",
        name: "Dr. Alan Turing",
        role: "Instructor",
        email: "a.turing@university.edu",
      },
      {
        id: "st5",
        name: "Mark Zeta",
        role: "Teaching Assistant",
        email: "m.zeta@university.edu",
      },
    ],
    sessions: [
      {
        id: "se6",
        date: "2025-09-08",
        topic: "Big-O Notation",
        status: "Scheduled",
      },
    ],
  },
];
