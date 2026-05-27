"use client"

import { use } from "react"
import { OfferingDetail } from "./offering-detail"

type Params = { id: string }

export default function CourseOfferingDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params)
  return <OfferingDetail id={id} />
}
