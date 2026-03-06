"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function FetchIntelButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ added: number; errors: string[] } | null>(null);

  async function handleFetch() {
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch("/api/admin/regulatory-intel/fetch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult({ added: 0, errors: [data.error ?? "Fetch failed"] });
        return;
      }
      setResult({ added: data.added ?? 0, errors: data.errors ?? [] });
      if (data.added > 0) setTimeout(() => router.refresh(), 800);
    } catch {
      setResult({ added: 0, errors: ["Network error — please try again"] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleFetch}
        disabled={loading}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        style={{
          background: "rgba(45,156,219,0.1)",
          color:      "#2d9cdb",
          border:     "1px solid rgba(45,156,219,0.25)",
        }}
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        {loading ? "Fetching from EU sources…" : "Fetch Latest"}
      </button>

      {result && (
        <div className="space-y-1">
          {result.added > 0 && (
            <p className="text-xs" style={{ color: "#2ecc71" }}>
              ✓ {result.added} new item{result.added !== 1 ? "s" : ""} added
            </p>
          )}
          {result.added === 0 && result.errors.length === 0 && (
            <p className="text-xs" style={{ color: "#3d4f60" }}>
              No new developments found
            </p>
          )}
          {result.errors.map((e, i) => (
            <p key={i} className="text-xs" style={{ color: "#e0a832" }}>
              ⚠ {e}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
