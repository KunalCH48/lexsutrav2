"use client";

// Handles magic link sign-in for admin impersonation (Login As).
// Tokens arrive as #access_token=... in the URL hash (implicit flow).
// The destination (?to=portal|admin) is encoded by the impersonate endpoint
// so we never need to query the profiles table here.

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function MagicAuthInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Signing in…");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const to = searchParams.get("to") === "admin" ? "/admin" : "/portal";

    const hash   = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const access_token  = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setIsError(true);
      setMessage("No session tokens found. The link may have expired or already been used.");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        setIsError(true);
        setMessage(error.message ?? "Failed to sign in. The link may have expired.");
        return;
      }
      router.replace(to);
    });
  }, [router, searchParams]);

  if (isError) {
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function MagicAuthPage() {
  return (
    <Suspense fallback={
      <div style={containerStyle}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <MagicAuthInner />
    </Suspense>
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
