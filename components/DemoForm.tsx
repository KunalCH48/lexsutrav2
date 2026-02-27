"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const BLOCKED_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "protonmail.com", "aol.com", "mail.com", "live.com", "msn.com",
  "yahoo.co.uk", "googlemail.com", "me.com", "mac.com",
]);

function isPersonalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? BLOCKED_DOMAINS.has(domain) : false;
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border bg-[#060a14] text-white placeholder-[#3d4f60] " +
  "border-white/10 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 " +
  "focus:ring-[#c9a84c]/25 transition disabled:opacity-50 text-sm";

export function DemoForm() {
  const [form, setForm] = useState({
    company_name: "",
    email: "",
    website_url: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.company_name.trim() || !form.email.trim() || !form.website_url.trim()) {
      setError("All fields are required.");
      return;
    }
    if (isPersonalEmail(form.email)) {
      setError("Please use your business email address. Personal email providers are not accepted.");
      return;
    }

    setStatus("submitting");

    try {
      const { error: dbError } = await supabase.from("demo_requests").insert([
        {
          company_name: form.company_name.trim(),
          email: form.email.trim().toLowerCase(),
          website_url: form.website_url.trim(),
          status: "pending",
        },
      ]);
      if (dbError) throw dbError;
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again or email us at hello@lexsutra.nl.");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-10">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ background: "rgba(76,175,124,0.15)", border: "1px solid rgba(76,175,124,0.3)" }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: "#4caf7c" }} />
        </div>
        <h3 className="text-2xl font-serif font-semibold text-white mb-3">
          Request received
        </h3>
        <p className="max-w-sm mx-auto text-sm" style={{ color: "#8899aa" }}>
          We&apos;ll review your details and send you a 5-insight compliance snapshot
          within 24 hours. No commitment required.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#8899aa" }}>
          Company name
        </label>
        <input
          type="text"
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          placeholder="Acme AI GmbH"
          disabled={status === "submitting"}
          className={inputClass}
          autoComplete="organization"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#8899aa" }}>
          Business email
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@company.com"
          disabled={status === "submitting"}
          className={inputClass}
          autoComplete="email"
        />
        <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
          Personal email providers (Gmail, Outlook, etc.) are not accepted.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#8899aa" }}>
          Company website
        </label>
        <input
          type="url"
          name="website_url"
          value={form.website_url}
          onChange={handleChange}
          placeholder="https://company.com"
          disabled={status === "submitting"}
          className={inputClass}
          autoComplete="url"
        />
      </div>

      {error && (
        <div
          className="flex items-start gap-2.5 p-3.5 rounded-lg"
          style={{ background: "rgba(231,76,76,0.08)", border: "1px solid rgba(231,76,76,0.2)" }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#e74c4c" }} />
          <p className="text-sm" style={{ color: "#e74c4c" }}>
            {error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "#c9a84c", color: "#060a14" }}
        onMouseEnter={(e) => { if (status !== "submitting") (e.target as HTMLButtonElement).style.background = "#dbbf6a"; }}
        onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "#c9a84c"; }}
      >
        {status === "submitting" ? (
          "Submitting…"
        ) : (
          <>
            Request Diagnostic Preview
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs" style={{ color: "#3d4f60" }}>
        We&apos;ll send a 5-insight snapshot within 24 hours. No commitment required.
      </p>
    </form>
  );
}
