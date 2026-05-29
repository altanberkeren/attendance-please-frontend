export type Course = {
  id: string;
  name: string;
  code: string;
  description: string;
};

export const MOCK_COURSES: Course[] = [
  {
    id: "1",
    name: "Introduction to Computer Science",
    code: "CS101",
    description: "Fundamentals of programming and computation.",
  },
  {
    id: "2",
    name: "Data Structures",
    code: "CS201",
    description: "Arrays, linked lists, trees, and graphs.",
  },
  {
    id: "3",
    name: "Algorithms",
    code: "CS301",
    description: "Algorithm design, analysis, and complexity.",
  },
  {
    id: "4",
    name: "Database Systems",
    code: "CS401",
    description: "Relational databases and SQL.",
  },
  {
    id: "5",
    name: "Operating Systems",
    code: "CS402",
    description: "Process management, memory, and I/O.",
  },
];
