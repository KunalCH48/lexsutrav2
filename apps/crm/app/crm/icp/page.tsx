import { createSupabaseAdminClient } from "@/lib/supabase-server";
import IcpEditor from "./IcpEditor";

export const dynamic = "force-dynamic";

export default async function IcpPage() {
  const db = createSupabaseAdminClient();
  const { data } = await db.from("icp_config").select("*").eq("id", 1).single();

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>ICP Configuration</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Your Ideal Customer Profile. Every prospect analysis uses this definition.
        </p>
      </div>

      <IcpEditor
        initialDescription={data?.description ?? ""}
        updatedAt={data?.updated_at ?? null}
      />

      <div className="card" style={{ marginTop: "1.5rem", background: "rgba(200,168,75,0.05)", borderColor: "rgba(200,168,75,0.2)" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent-gold)", marginBottom: "0.5rem" }}>
          How it's used
        </p>
        <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--text-muted)" }}>
          When you run an analysis on a prospect, Claude Haiku reads the company's website and evaluates it
          against this ICP. The result is a <strong style={{ color: "var(--text-bright)" }}>Strong / Possible / Unlikely</strong> score
          plus reasoning, approach angle, and red flags. Edit the ICP any time — re-running an analysis will
          use the latest version.
        </p>
      </div>
    </div>
  );
}
