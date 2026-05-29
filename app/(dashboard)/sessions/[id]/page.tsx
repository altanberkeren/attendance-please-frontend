import { MOCK_SESSIONS } from "@/lib/mock-data";
import { SessionDetailClient } from "./session-detail-client";

type Params = { id: string };

export function generateStaticParams(): Params[] {
  return MOCK_SESSIONS.map((session) => ({ id: String(session.id) }));
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  return <SessionDetailClient id={id} />;
}
