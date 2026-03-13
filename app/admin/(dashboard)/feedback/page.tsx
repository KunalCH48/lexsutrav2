import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { setTestimonialApproved } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Feedback — LexSutra Admin" };

const LABELS = ["", "Poor", "Below avg", "Average", "Good", "Excellent"];

function Stars({ value }: { value: number }) {
  return (
    <span>
      {"★".repeat(value)}
      <span style={{ color: "rgba(255,255,255,0.15)" }}>{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default async function FeedbackPage() {
  const adminClient = createSupabaseAdminClient();
  const { data: rows } = await adminClient
    .from("client_feedback")
    .select("id, feedback_text, rating_experience, rating_usefulness, rating_value_for_money, can_use_as_testimonial, testimonial_approved, display_name, display_role, display_company, created_at, companies(name)")
    .order("created_at", { ascending: false });

  const pending  = (rows ?? []).filter((r: any) => r.can_use_as_testimonial && !r.testimonial_approved);
  const approved = (rows ?? []).filter((r: any) => r.testimonial_approved);
  const rest     = (rows ?? []).filter((r: any) => !r.can_use_as_testimonial);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}>
          Client Feedback
        </h1>
        <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
          {rows?.length ?? 0} submission{rows?.length !== 1 ? "s" : ""} total
          {pending.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium" style={{ background: "rgba(200,168,75,0.15)", color: "#c8a84b" }}>
              {pending.length} awaiting approval
            </span>
          )}
        </p>
      </div>

      {/* Pending approval */}
      {pending.length > 0 && (
        <Section title="Awaiting Testimonial Approval" accent="#c8a84b" rows={pending} />
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <Section title="Approved Testimonials" accent="#2ecc71" rows={approved} />
      )}

      {/* No consent */}
      {rest.length > 0 && (
        <Section title="Private Feedback (no testimonial consent)" accent="#3d4f60" rows={rest} />
      )}

      {(!rows || rows.length === 0) && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm" style={{ color: "#3d4f60" }}>No feedback submitted yet.</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, accent, rows }: {
  title: string;
  accent: string;
  rows: any[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>
        {title}
      </p>
      <div className="space-y-4">
        {rows.map((row) => (
          <FeedbackCard key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}

function FeedbackCard({ row }: { row: any }) {
  const avg = Math.round((row.rating_experience + row.rating_usefulness + row.rating_value_for_money) / 3);

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
            {(row.companies as any)?.name ?? "Unknown company"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
            {new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        {/* Ratings */}
        <div className="text-right shrink-0 space-y-0.5">
          {[
            { label: "Experience",    value: row.rating_experience },
            { label: "Usefulness",    value: row.rating_usefulness },
            { label: "Value / money", value: row.rating_value_for_money },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2 justify-end">
              <span className="text-xs" style={{ color: "#3d4f60" }}>{label}</span>
              <span className="text-sm" style={{ color: "#c8a84b" }}>
                {"★".repeat(value)}<span style={{ color: "rgba(255,255,255,0.1)" }}>{"★".repeat(5 - value)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <blockquote className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
        &ldquo;{row.feedback_text}&rdquo;
      </blockquote>

      {/* Attribution + actions */}
      <div className="flex items-center justify-between gap-4 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="text-xs" style={{ color: "#3d4f60" }}>
          {row.can_use_as_testimonial ? (
            <>
              Consent given
              {row.display_name && (
                <span style={{ color: "#8899aa" }}>
                  {" "}· {row.display_name}{row.display_role ? `, ${row.display_role}` : ""}
                  {row.display_company ? ` · ${row.display_company}` : ""}
                </span>
              )}
            </>
          ) : (
            <span>No testimonial consent</span>
          )}
        </div>

        {row.can_use_as_testimonial && (
          <form action={setTestimonialApproved.bind(null, row.id, !row.testimonial_approved)}>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={row.testimonial_approved ? {
                background: "rgba(224,82,82,0.1)",
                border:     "1px solid rgba(224,82,82,0.2)",
                color:      "#e05252",
              } : {
                background: "rgba(46,204,113,0.1)",
                border:     "1px solid rgba(46,204,113,0.2)",
                color:      "#2ecc71",
              }}
            >
              {row.testimonial_approved ? "Revoke approval" : "Approve testimonial →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
