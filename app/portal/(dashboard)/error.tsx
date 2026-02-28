"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Portal Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.2)" }}
      >
        <AlertTriangle size={24} style={{ color: "#e05252" }} />
      </div>
      <div className="text-center space-y-1">
        <h2
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Something went wrong
        </h2>
        <p className="text-sm" style={{ color: "#8899aa" }}>
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs font-mono mt-2" style={{ color: "#3d4f60" }}>
            Ref: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: "rgba(45,156,219,0.1)",
            border:     "1px solid rgba(45,156,219,0.25)",
            color:      "#2d9cdb",
          }}
        >
          <RefreshCw size={14} />
          Try again
        </button>
        <a
          href="/portal"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: "rgba(255,255,255,0.04)",
            border:     "1px solid rgba(255,255,255,0.08)",
            color:      "#8899aa",
          }}
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
