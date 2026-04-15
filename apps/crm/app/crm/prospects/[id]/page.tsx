import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import ProspectDetail from "./ProspectDetail";

export const dynamic = "force-dynamic";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createSupabaseAdminClient();

  const [prospectRes, messagesRes] = await Promise.all([
    db.from("prospects").select("*").eq("id", id).single(),
    db.from("prospect_messages").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
  ]);

  if (prospectRes.error || !prospectRes.data) notFound();

  return (
    <ProspectDetail
      prospect={prospectRes.data}
      messages={messagesRes.data ?? []}
    />
  );
}
