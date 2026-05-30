"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionDetailClient } from "./session-detail-client";

export default function SessionDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

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

  return <SessionDetailClient id={id} />;
}
