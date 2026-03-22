"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Props = {
  grade:          string;
  generatedAt:    string;   // ISO — used as dismissal key so a new snapshot resurfaces the nudge
};

function gradeColor(grade: string) {
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "#2ecc71";
  if (g.startsWith("B")) return "#e0a832";
  if (g.startsWith("C")) return "#e07850";
  return "#e05252";
}

export function SnapshotNudge({ grade, generatedAt }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `ls_snap_nudge_${generatedAt}`;
    if (!localStorage.getItem(key)) setVisible(true);
  }, [generatedAt]);

  function dismiss() {
    localStorage.setItem(`ls_snap_nudge_${generatedAt}`, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const gColor = gradeColor(grade);

  return (
    <div
      className="flex items-center gap-4 rounded-xl px-5 py-3.5"
      style={{
        background:  "rgba(200,168,75,0.04)",
        border:      "1px solid rgba(200,168,75,0.18)",
        borderLeft:  "3px solid #c8a84b",
      }}
    >
      {/* Grade badge */}
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 7,
        background: `${gColor}14`,
        border: `1.5px solid ${gColor}44`,
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: gColor, fontFamily: "Georgia, serif", lineHeight: 1 }}>
          {grade}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
          Your compliance snapshot is ready
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#8899aa" }}>
          LexSutra has prepared a pre-diagnostic EU AI Act compliance assessment for your organisation.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/portal/reports/snapshot"
        onClick={dismiss}
        className="text-xs font-semibold px-3.5 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-80"
        style={{
          background: "rgba(200,168,75,0.12)",
          border:     "1px solid rgba(200,168,75,0.3)",
          color:      "#c8a84b",
          whiteSpace: "nowrap",
        }}
      >
        View Report →
      </Link>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors hover:opacity-60"
        style={{ color: "#3d4f60" }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
