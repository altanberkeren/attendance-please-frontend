"use client";

import { useSearchParams } from "next/navigation";
import { OfferingDetail } from "../[id]/offering-detail";

export default function CourseOfferingDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return <p className="text-sm text-muted-foreground">Course offering id is missing.</p>;
  }

  return <OfferingDetail offeringId={id} />;
}
