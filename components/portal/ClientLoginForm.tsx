"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const ERROR_MESSAGES: Record<string, string> = {
  not_client: "This account doesn't have client access. Contact us at hello@lexsutra.nl.",
  auth_failed: "Authentication failed. Please try again.",
};

export function ClientLoginForm({ error }: { error?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // NOTE: /portal/auth/callback must be whitelisted in Supabase dashboard
        // Auth > URL Configuration > Redirect URLs
        redirectTo: `${window.location.origin}/portal/auth/callback`,
      },
    });
    // Page navigates away — no need to setLoading(false)
  }

  return (
    <div className="space-y-5">
      {error && ERROR_MESSAGES[error] && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(224,82,82,0.08)",
            border: "1px solid rgba(224,82,82,0.2)",
            color: "#e05252",
          }}
        >
          {ERROR_MESSAGES[error]}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#e8f4ff",
        }}
      >
        {loading ? (
          <span style={{ color: "#8899aa" }}>Redirecting…</span>
        ) : (
          <>
            {/* Google logo */}
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

      <p className="text-center text-xs" style={{ color: "#3d4f60" }}>
        Access is by invitation only. Received an invite? Use the same email address.
      </p>
    </div>
  );
}
