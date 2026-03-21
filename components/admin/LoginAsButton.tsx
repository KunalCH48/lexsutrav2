"use client";

import { useState } from "react";
import { LogIn, Loader2 } from "lucide-react";

type Props = {
  userId: string;
  label?: string;
};

export function LoginAsButton({ userId, label = "Login As" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleClick() {
    // Warn: using the link signs admin out in all tabs (shared localStorage)
    const ok = window.confirm(
      `This will open a session as this user.\n\n` +
      `⚠️ It will sign YOU OUT as admin in this browser tab — you'll need to sign back in after.\n\n` +
      `Tip: copy the link into a different browser/incognito window to avoid this.\n\nProceed?`
    );
    if (!ok) return;

    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/admin/impersonate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
      // Open in new tab
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity"
        style={{
          background: "rgba(200,168,75,0.1)",
          color:      "#c8a84b",
          border:     "1px solid rgba(200,168,75,0.2)",
          opacity:    loading ? 0.6 : 1,
          cursor:     loading ? "default" : "pointer",
        }}
        title="Open their session in a new tab"
      >
        {loading
          ? <Loader2 size={11} className="animate-spin" />
          : <LogIn size={11} />
        }
        {loading ? "Generating…" : label}
      </button>
      {error && (
        <span className="text-xs" style={{ color: "#e05252" }}>{error}</span>
      )}
    </div>
  );
}
