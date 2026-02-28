import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logError } from "@/lib/log-error";

const NOTIFY_EMAIL = "kunal.lexutra@gmail.com";

// In-memory rate limiter: max 5 submissions per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let company_name = "";
  let email        = "";

  try {
    const body = await req.json();
    company_name = body.company_name ?? "";
    email        = body.email        ?? "";
    const website_url: string = body.website_url ?? "";

    if (!company_name || !email || !website_url) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Save to Supabase
    const { error: dbError } = await supabase
      .from("demo_requests")
      .insert([{ company_name, contact_email: email, website_url, status: "pending" }]);

    if (dbError) {
      await logError({
        error: dbError,
        source: "api/demo-request",
        action: "POST",
        metadata: { company_name, email, website_url },
      });
      return NextResponse.json({ error: "Failed to save your request. Please try again." }, { status: 500 });
    }

    // Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LexSutra <hello@lexsutra.nl>",
          to:   [NOTIFY_EMAIL],
          subject: `New demo request — ${company_name}`,
          html: `
            <h2>New Demo Request</h2>
            <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
              <tr><td><strong>Company</strong></td><td>${company_name}</td></tr>
              <tr><td><strong>Email</strong></td><td>${email}</td></tr>
              <tr><td><strong>Website</strong></td><td><a href="${website_url}">${website_url}</a></td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:24px;">
              Submitted via lexsutra.nl
            </p>
          `,
        }),
      });

      if (!emailRes.ok) {
        // Don't fail the request — the lead is saved. Just log the email failure.
        await logError({
          error: new Error(`Resend returned ${emailRes.status}`),
          source: "api/demo-request",
          action: "POST:sendNotificationEmail",
          severity: "warning",
          metadata: { company_name, email, resend_status: emailRes.status },
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    await logError({
      error: err,
      source: "api/demo-request",
      action: "POST",
      metadata: { company_name, email },
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email us at hello@lexsutra.nl." },
      { status: 500 }
    );
  }
}
