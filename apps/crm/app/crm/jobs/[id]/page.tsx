import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import JobDetail from "./JobDetail";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createSupabaseAdminClient();

  const [jobRes, messagesRes] = await Promise.all([
    db.from("job_applications").select("*").eq("id", id).single(),
    db.from("job_messages").select("*").eq("job_id", id).order("created_at", { ascending: false }),
  ]);

  if (jobRes.error || !jobRes.data) notFound();

  return <JobDetail job={jobRes.data} messages={messagesRes.data ?? []} />;
}
