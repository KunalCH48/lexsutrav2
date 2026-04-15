import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { to, subject, body, recordId, recordType } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "to, subject, and body are required" }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Invalid recipient email address" }, { status: 400 });
  }

  try {
    const { error: sendError } = await resend.emails.send({
      from: "Kunal Chaudhari <kunal@lexsutra.com>",
      to,
      subject,
      text: body,
    });

    if (sendError) {
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    // Log sent email + update prospect status
    if (recordId && recordType) {
      const db = createSupabaseAdminClient();
      const table    = recordType === "prospect" ? "prospect_messages" : "job_messages";
      const fkField  = recordType === "prospect" ? "prospect_id"       : "job_id";
      const mainTable = recordType === "prospect" ? "prospects"         : "job_applications";

      await Promise.all([
        // Save email as a message on the record
        db.from(table).insert({
          [fkField]: recordId,
          label:   `Sent — ${subject}`,
          content: `To: ${to}\nSubject: ${subject}\n\n${body}`,
        }),
        // Update status to "contacted"
        db.from(mainTable)
          .update({ status: "contacted" })
          .eq("id", recordId)
          .eq("status", "new"), // only update if still "new"
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 },
    );
  }
}
