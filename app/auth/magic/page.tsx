"use client";

// Handles magic link sign-in for admin impersonation (Login As).
// Magic links from admin.generateLink() use implicit flow — tokens arrive as
// #access_token=... in the URL hash. We parse them directly and call setSession()
// to override whatever session is currently in the browser.
//
// ⚠️  Important: Supabase stores sessions in localStorage (shared across tabs).
// Signing in as another user will sign the admin out in all other tabs.
// The admin must sign back in afterwards.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Step = "loading" | "error";

export default function MagicAuthPage() {
  const router = useRouter();
  const [step,    setStep]    = useState<Step>("loading");
  const [message, setMessage] = useState("Signing in…");

  useEffect(() => {
    const hash   = window.location.hash.substring(1); // strip leading #
    const params = new URLSearchParams(hash);
    const access_token  = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setStep("error");
      setMessage("No session tokens found. The link may have expired or already been used.");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
      if (error || !data.session) {
        setStep("error");
        setMessage(error?.message ?? "Failed to establish session. The link may have expired.");
        return;
      }

      // Look up the user's role and redirect to the right area
      supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.role === "client") {
            router.replace("/portal");
          } else if (profile?.role === "admin" || profile?.role === "reviewer") {
            router.replace("/admin");
          } else {
            setStep("error");
            setMessage("No profile found for this user.");
          }
        });
    });
  }, [router]);

  if (step === "error") {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#e05252", fontSize: "14px", textAlign: "center", maxWidth: "320px" }}>
          {message}
        </p>
        <a href="/admin" style={{ color: "#2d9cdb", fontSize: "13px", marginTop: "12px" }}>
          ← Back to Admin
        </a>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      <p style={{ color: "#8899aa", fontSize: "14px" }}>{message}</p>
      <p style={{ color: "rgba(232,244,255,0.25)", fontSize: "12px", marginTop: "4px" }}>
        Note: this will sign you out as admin in other tabs.
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  height:         "100vh",
  background:     "#080c14",
  flexDirection:  "column",
  gap:            "12px",
};

const spinnerStyle: React.CSSProperties = {
  width:        "24px",
  height:       "24px",
  border:       "2px solid rgba(45,156,219,0.3)",
  borderTop:    "2px solid #2d9cdb",
  borderRadius: "50%",
  animation:    "spin 0.8s linear infinite",
};
