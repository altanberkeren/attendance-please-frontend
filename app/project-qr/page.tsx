"use client";

import { useSearchParams } from "next/navigation";
import { SessionDetailClient } from "../(dashboard)/sessions/detail/session-detail-client";

export default function ProjectQrPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#050505] p-8 text-white">
        <p className="text-sm text-white/60">Session id is required.</p>
      </main>
    );
  }

  return <SessionDetailClient id={id} projectQr />;
}
