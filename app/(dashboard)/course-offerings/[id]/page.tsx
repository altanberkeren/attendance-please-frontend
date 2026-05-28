import { MOCK_COURSE_OFFERINGS } from "@/lib/mock/course-offerings"
import { OfferingDetail } from "./offering-detail"

type Params = { id: string }

export function generateStaticParams(): Params[] {
  return MOCK_COURSE_OFFERINGS.map((o) => ({ id: o.id }))
}

export default async function CourseOfferingDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const offering = MOCK_COURSE_OFFERINGS.find((o) => o.id === id)

  return <OfferingDetail offering={offering} />
}
