"use client";

import { useState } from "react";
import { LogIn, Loader2 } from "lucide-react";

type Props = {
  userId: string;
  label?: string;
};

export function LoginAsButton({ userId, label = "Login As" }: Props) {
  const [loading, setLoading] = useState(false);
  const [url,     setUrl]     = useState("");
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  async function handleClick() {
    setLoading(true);
    setError("");
    setUrl("");
    try {
      const res  = await fetch("/api/admin/impersonate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setUrl(data.url);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (url) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{
            background: copied ? "rgba(46,204,113,0.1)" : "rgba(200,168,75,0.1)",
            color:      copied ? "#2ecc71" : "#c8a84b",
            border:     `1px solid ${copied ? "rgba(46,204,113,0.25)" : "rgba(200,168,75,0.2)"}`,
          }}
        >
          {copied ? "✓ Copied!" : "Copy link → paste in incognito"}
        </button>
        <button
          onClick={() => setUrl("")}
          className="text-xs"
          style={{ color: "rgba(232,244,255,0.25)" }}
        >
          ✕
        </button>
      </div>
    );
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
