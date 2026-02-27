import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const NOTIFY_EMAIL = "kunal.lexutra@gmail.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { company_name, email, website_url } = await req.json();

    if (!company_name || !email || !website_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save to Supabase
    const { error: dbError } = await supabase.from("demo_requests").insert([
      { company_name, email, website_url, status: "pending" },
    ]);
    if (dbError) throw dbError;

    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LexSutra <hello@lexsutra.nl>",
          to: [NOTIFY_EMAIL],
          subject: `New demo request — ${company_name}`,
          html: `
            <h2>New Demo Request</h2>
            <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
              <tr><td><strong>Company</strong></td><td>${company_name}</td></tr>
              <tr><td><strong>Email</strong></td><td>${email}</td></tr>
              <tr><td><strong>Website</strong></td><td><a href="${website_url}">${website_url}</a></td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:24px;">
              Submitted via lexsutrav2.vercel.app
            </p>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("demo-request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
