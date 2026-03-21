"use client";

import { useState } from "react";

type Props = {
  id: string;
  published: boolean;
};

export function PublishIntelButton({ id, published: initialPublished }: Props) {
  const [published, setPublished] = useState(initialPublished);
  const [loading, setLoading]     = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !published;
    setPublished(next); // optimistic
    try {
      const res = await fetch("/api/admin/regulatory-intel/publish", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, published: next }),
      });
      if (!res.ok) setPublished(!next); // revert on error
    } catch {
      setPublished(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="text-xs px-3 py-1 rounded-lg font-medium transition-all disabled:opacity-50"
      style={published ? {
        background: "rgba(46,204,113,0.1)",
        border:     "1px solid rgba(46,204,113,0.3)",
        color:      "#2ecc71",
      } : {
        background: "rgba(255,255,255,0.04)",
        border:     "1px solid rgba(255,255,255,0.1)",
        color:      "#3d4f60",
      }}
    >
      {loading ? "…" : published ? "✓ Published" : "Publish"}
    </button>
  );
}
