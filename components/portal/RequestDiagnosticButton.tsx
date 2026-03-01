"use client";

import { useState, useTransition } from "react";
import { requestDiagnostic } from "@/app/portal/(dashboard)/diagnostics/actions";

export function RequestDiagnosticButton() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleClick() {
    startTransition(async () => {
      const result = await requestDiagnostic();
      if ("error" in result) {
        setErrorMsg(result.error);
        setState("error");
      } else {
        setState("done");
      }
    });
  }

  if (state === "done") {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: "rgba(46,204,113,0.06)", border: "1px solid rgba(46,204,113,0.2)" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "#2ecc71" }}>
          Request sent
        </p>
        <p className="text-xs" style={{ color: "#8899aa" }}>
          We&apos;ve received your request and will be in touch within 24 hours to schedule your diagnostic.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state === "error" && (
        <p className="text-xs" style={{ color: "#e05252" }}>{errorMsg}</p>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity"
        style={{
          background: isPending ? "rgba(45,156,219,0.4)" : "#2d9cdb",
          color:      "#fff",
          cursor:     isPending ? "not-allowed" : "pointer",
          opacity:    isPending ? 0.7 : 1,
        }}
      >
        {isPending ? "Sending request…" : "Request a Diagnostic →"}
      </button>
      <p className="text-xs text-center" style={{ color: "#3d4f60" }}>
        We&apos;ll contact you within 24 hours to discuss next steps.
      </p>
    </div>
  );
}
