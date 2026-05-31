"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { SessionDetailClient } from "./session-detail-client";

export default function SessionDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const projectQr = searchParams.get("projectQr") === "1";
  const courseOfferingId = searchParams.get("courseOfferingId");

  useEffect(() => {
    if (!id || !projectQr) return;
    router.replace(
      `/project-qr?id=${encodeURIComponent(id)}${courseOfferingId ? `&courseOfferingId=${encodeURIComponent(courseOfferingId)}` : ""}`,
    );
  }, [courseOfferingId, id, projectQr, router]);

  if (!id) {
    return (
      <div className="mx-auto max-w-screen-md space-y-4">
        <button
          type="button"
          onClick={() => router.push("/attendance")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to attendance
        </button>
        <p className="text-sm text-muted-foreground">Session id is required.</p>
      </div>
    );
  }

  if (projectQr) return null;

  return <SessionDetailClient id={id} />;
}
