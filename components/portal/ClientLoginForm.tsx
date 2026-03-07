"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type ErrorDef = { message: string; tone: "red" | "amber" };

const ERROR_MESSAGES: Record<string, ErrorDef> = {
  not_client:      { tone: "red",   message: "This account doesn't have client access. Contact us at hello@lexsutra.eu." },
  auth_failed:     { tone: "red",   message: "Authentication failed. Please try again." },
  invite_invalid:  { tone: "red",   message: "This access link is not valid. Please contact your LexSutra account manager for a new one." },
  invite_expired:  { tone: "amber", message: "This access link has expired. Please contact your LexSutra account manager for a fresh link." },
  invite_used:     { tone: "amber", message: "This access link has already been used the maximum number of times. Please contact your LexSutra account manager for a new one." },
};

export function ClientLoginForm({ error }: { error?: string }) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail]                 = useState("");
  const [otpLoading, setOtpLoading]       = useState(false);
  const [otpSent, setOtpSent]             = useState(false);
  const [otpError, setOtpError]           = useState("");

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/portal/auth/callback`,
      },
    });
  }

  async function handleMagicLink(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setOtpLoading(true);
    setOtpError("");

    const supabase = createSupabaseBrowserClient();
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo:  `${window.location.origin}/portal/auth/callback`,
        shouldCreateUser: true,
      },
    });

    setOtpLoading(false);

    if (otpErr) {
      setOtpError("Failed to send link. Please check your email address and try again.");
    } else {
      setOtpSent(true);
    }
  }

  return (
    <div className="space-y-5">
      {error && ERROR_MESSAGES[error] && (() => {
        const { message, tone } = ERROR_MESSAGES[error];
        const isAmber = tone === "amber";
        return (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              background: isAmber ? "rgba(224,168,50,0.08)"  : "rgba(224,82,82,0.08)",
              border:     isAmber ? "1px solid rgba(224,168,50,0.25)" : "1px solid rgba(224,82,82,0.2)",
              color:      isAmber ? "#e0a832" : "#e05252",
            }}
          >
            {message}
          </div>
        );
      })()}

      {/* Google SSO */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        style={{
          background: "rgba(255,255,255,0.05)",
          border:     "1px solid rgba(255,255,255,0.1)",
          color:      "#e8f4ff",
        }}
      >
        {googleLoading ? (
          <span style={{ color: "#8899aa" }}>Redirecting…</span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="text-xs" style={{ color: "#3d4f60" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Magic link / OTP */}
      {otpSent ? (
        <div
          className="rounded-lg px-4 py-4 text-center"
          style={{
            background: "rgba(46,204,113,0.06)",
            border:     "1px solid rgba(46,204,113,0.2)",
          }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: "#2ecc71" }}>Check your email</p>
          <p className="text-xs" style={{ color: "#8899aa" }}>
            We sent a sign-in link to <strong>{email}</strong>. Click it to access your portal.
          </p>
        </div>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@company.com"
            required
            className="w-full px-4 py-3 rounded-lg text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border:     "1px solid rgba(255,255,255,0.08)",
              color:      "#e8f4ff",
            }}
          />
          {otpError && (
            <p className="text-xs" style={{ color: "#e05252" }}>{otpError}</p>
          )}
          <button
            type="submit"
            disabled={otpLoading || !email.trim()}
            className="w-full py-3 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              background: "rgba(45,156,219,0.12)",
              border:     "1px solid rgba(45,156,219,0.25)",
              color:      "#2d9cdb",
            }}
          >
            {otpLoading ? "Sending…" : "Send sign-in link →"}
          </button>
        </form>
      )}

      <p className="text-center text-xs" style={{ color: "#3d4f60" }}>
        Access is by invitation only. Use the email address your portal was set up with.
      </p>
    </div>
  );
}
