"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SessionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/staff-courses");
  }, [router]);

  return <p className="text-sm text-muted-foreground">Redirecting…</p>;
}
