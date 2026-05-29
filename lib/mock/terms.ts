export type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export const MOCK_TERMS: Term[] = [
  {
    id: "1",
    name: "Fall 2024",
    startDate: "2024-09-02",
    endDate: "2024-12-20",
  },
  {
    id: "2",
    name: "Spring 2025",
    startDate: "2025-01-13",
    endDate: "2025-05-09",
  },
  {
    id: "3",
    name: "Summer 2025",
    startDate: "2025-06-02",
    endDate: "2025-08-15",
  },
  {
    id: "4",
    name: "Fall 2025",
    startDate: "2025-09-01",
    endDate: "2025-12-19",
  },
];
