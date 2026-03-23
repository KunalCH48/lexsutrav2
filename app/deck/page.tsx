"use client";

import React, { useState, useEffect, useCallback } from "react";

// ─── Shield logo ─────────────────────────────────────────────────────────────
function ShieldLogo({ size = 40 }: { size?: number }) {
  const h = Math.round(size * 1.2);
  return (
    <svg width={size} height={h} viewBox="0 0 40 48" fill="none">
      <path
        d="M20 2L4 9v13c0 10.5 6.8 20.3 16 23 9.2-2.7 16-12.5 16-23V9L20 2z"
        fill="rgba(200,168,75,0.15)"
        stroke="#c8a84b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="22" r="7" fill="none" stroke="#c8a84b" strokeWidth="1.2" />
      <line x1="20" y1="15" x2="20" y2="29" stroke="#c8a84b" strokeWidth="1" strokeLinecap="round" />
      <line x1="13" y1="22" x2="27" y2="22" stroke="#c8a84b" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// ─── Shared wrappers ──────────────────────────────────────────────────────────
function Slide({
  children,
  justify = "center",
}: {
  children: React.ReactNode;
  justify?: "center" | "start";
}) {
  return (
    <div
      style={{
        height: "calc(100dvh - 72px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: justify === "center" ? "center" : "flex-start",
        alignItems: "center",
        padding: "32px 48px",
        maxWidth: 860,
        margin: "0 auto",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#2d9cdb",
        background: "rgba(45,156,219,0.08)",
        border: "1px solid rgba(45,156,219,0.2)",
        borderRadius: 6,
        padding: "4px 12px",
        display: "inline-block",
        marginBottom: 28,
      }}
    >
      {children}
    </span>
  );
}

function Divider() {
  return (
    <div
      style={{ width: 40, height: 1, background: "rgba(200,168,75,0.4)", margin: "20px auto" }}
    />
  );
}

// ─── Slide 01 — Title ─────────────────────────────────────────────────────────
function S01Title() {
  return (
    <Slide>
      <ShieldLogo size={54} />
      <h1
        style={{
          fontFamily: "var(--font-playfair, serif)",
          fontSize: "clamp(52px, 10vw, 96px)",
          fontWeight: 600,
          color: "#e8f4ff",
          margin: "18px 0 6px",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        LexSutra
      </h1>
      <p style={{ fontSize: 15, color: "#2d9cdb", letterSpacing: "0.1em", marginBottom: 28 }}>
        EU AI ACT COMPLIANCE DIAGNOSTICS
      </p>
      <Divider />
      <div style={{ display: "flex", gap: 40, justifyContent: "center", marginBottom: 44 }}>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 20,
              fontFamily: "var(--font-playfair, serif)",
              color: "#c8a84b",
              fontWeight: 500,
              margin: 0,
            }}
          >
            Lex
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
            Latin · law
          </p>
        </div>
        <div
          style={{
            width: 1,
            background: "rgba(255,255,255,0.1)",
            alignSelf: "stretch",
          }}
        />
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 20,
              fontFamily: "var(--font-playfair, serif)",
              color: "#c8a84b",
              fontWeight: 500,
              margin: 0,
            }}
          >
            Sutra
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
            Sanskrit · guiding thread
          </p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em" }}>
        Press → or click to continue
      </p>
    </Slide>
  );
}

// ─── Slide 02 — Trigger Insight ───────────────────────────────────────────────
function S02Insight() {
  return (
    <Slide>
      <Label>The Trigger Insight</Label>
      <div
        style={{
          background: "rgba(200,168,75,0.05)",
          border: "1px solid rgba(200,168,75,0.2)",
          borderLeft: "3px solid #c8a84b",
          borderRadius: "0 14px 14px 0",
          padding: "28px 36px",
          maxWidth: 640,
          marginBottom: 36,
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontSize: "clamp(22px, 3.5vw, 36px)",
            fontFamily: "var(--font-playfair, serif)",
            fontWeight: 500,
            color: "#e8f4ff",
            lineHeight: 1.35,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          "Compliance is not a final step.
          <br />
          It is a design constraint."
        </p>
      </div>
      <p
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.8,
          maxWidth: 560,
        }}
      >
        By the time legal teams get involved, many architectural decisions are already
        fixed — making compliance slower, more expensive, and sometimes impossible to
        retrofit.
      </p>
    </Slide>
  );
}

// ─── Slide 03 — Problem overview (2×2 grid) ───────────────────────────────────
function S03ProblemOverview() {
  const problems = [
    {
      n: "01",
      title: "Misclassification Risk",
      desc: "Companies don't know if they're in scope at all.",
    },
    {
      n: "02",
      title: "Fragmented Understanding",
      desc: "Legal, engineering, and product teams aren't connected.",
    },
    {
      n: "03",
      title: "Timing Problem",
      desc: "Too early is expensive. Too late is worse.",
    },
    {
      n: "04",
      title: "No Diagnostic Layer",
      desc: "No structured early checkpoint exists.",
    },
  ];
  return (
    <Slide>
      <Label>Four Problems</Label>
      <h2
        style={{
          fontFamily: "var(--font-playfair, serif)",
          fontSize: "clamp(24px, 3.5vw, 40px)",
          fontWeight: 500,
          color: "#e8f4ff",
          marginBottom: 36,
          lineHeight: 1.25,
        }}
      >
        How AI companies approach compliance today
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          width: "100%",
          maxWidth: 680,
        }}
      >
        {problems.map((p) => (
          <div
            key={p.n}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "20px 22px",
              textAlign: "left",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(200,168,75,0.45)",
                letterSpacing: "0.1em",
              }}
            >
              {p.n}
            </span>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#e8f4ff",
                margin: "8px 0 6px",
              }}
            >
              {p.title}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.38)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// ─── Shared problem slide layout ──────────────────────────────────────────────
function ProblemSlide({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Slide>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 640,
        }}
      >
        <div
          style={{
            fontSize: "clamp(64px, 11vw, 112px)",
            fontFamily: "var(--font-playfair, serif)",
            fontWeight: 600,
            color: "rgba(200,168,75,0.1)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            marginBottom: -4,
          }}
        >
          {number}
        </div>
        <div
          style={{
            width: 36,
            height: 1,
            background: "rgba(200,168,75,0.4)",
            margin: "14px auto",
          }}
        />
        <h2
          style={{
            fontFamily: "var(--font-playfair, serif)",
            fontSize: "clamp(22px, 4vw, 42px)",
            fontWeight: 500,
            color: "#e8f4ff",
            marginBottom: 28,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </Slide>
  );
}

// ─── Slide 04 — Misclassification ─────────────────────────────────────────────
function S04Problem1() {
  return (
    <ProblemSlide number="01" title="Misclassification Risk">
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 18 }}>
        Companies don't know if they are:
      </p>
      <div
        style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginBottom: 24 }}
      >
        {[
          "High-risk — full obligation stack applies",
          "Limited-risk — transparency rules only",
          "Out of scope — no AI Act obligations at all",
        ].map((item) => (
          <div
            key={item}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8,
              padding: "12px 18px",
              fontSize: 14,
              color: "rgba(255,255,255,0.65)",
              textAlign: "left",
            }}
          >
            {item}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 15, color: "#c8a84b", fontStyle: "italic" }}>
        This single question changes every requirement, timeline, and budget.
      </p>
    </ProblemSlide>
  );
}

// ─── Slide 05 — Fragmented understanding ──────────────────────────────────────
function S05Problem2() {
  return (
    <ProblemSlide number="02" title="Fragmented Understanding">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr auto 1fr",
          gap: 8,
          alignItems: "center",
          width: "100%",
          marginBottom: 28,
        }}
      >
        {(
          [
            { label: "Legal team", sub: "interprets the law" },
            null,
            { label: "Engineering", sub: "builds the system" },
            null,
            { label: "Product", sub: "ships the feature" },
          ] as ({ label: string; sub: string } | null)[]
        ).map((item, i) =>
          item === null ? (
            <div
              key={i}
              style={{ textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 20 }}
            >
              ×
            </div>
          ) : (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: "16px 10px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#e8f4ff",
                  margin: "0 0 4px",
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {item.sub}
              </p>
            </div>
          )
        )}
      </div>
      <div
        style={{
          background: "rgba(45,156,219,0.05)",
          border: "1px solid rgba(45,156,219,0.2)",
          borderRadius: 10,
          padding: "14px 24px",
        }}
      >
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", margin: 0 }}>
          Nobody connects:{" "}
          <span style={{ color: "#2d9cdb", fontWeight: 600 }}>
            Regulation → Product behaviour
          </span>
        </p>
      </div>
    </ProblemSlide>
  );
}

// ─── Slide 06 — Timing ────────────────────────────────────────────────────────
function S06Problem3() {
  return (
    <ProblemSlide number="03" title="The Timing Problem">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          width: "100%",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: "rgba(45,156,219,0.04)",
            border: "1px solid rgba(45,156,219,0.18)",
            borderRadius: 12,
            padding: "22px 18px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#2d9cdb",
              letterSpacing: "0.1em",
              fontWeight: 600,
              margin: "0 0 10px",
            }}
          >
            TOO EARLY
          </p>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Unnecessary legal cost before product decisions are made
          </p>
        </div>
        <div
          style={{
            background: "rgba(224,82,82,0.04)",
            border: "1px solid rgba(224,82,82,0.18)",
            borderRadius: 12,
            padding: "22px 18px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#e05252",
              letterSpacing: "0.1em",
              fontWeight: 600,
              margin: "0 0 10px",
            }}
          >
            TOO LATE
          </p>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Decisions locked in. Expensive fixes. No time to remediate.
          </p>
        </div>
      </div>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
        There is no structured early checkpoint between these two extremes.
      </p>
    </ProblemSlide>
  );
}

// ─── Slide 07 — No diagnostic layer ──────────────────────────────────────────
function S07Problem4() {
  return (
    <ProblemSlide number="04" title="No Diagnostic Layer">
      <p
        style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 22 }}
      >
        There is no equivalent of:
      </p>
      <div
        style={{
          background: "rgba(200,168,75,0.05)",
          border: "1px solid rgba(200,168,75,0.22)",
          borderLeft: "3px solid #c8a84b",
          borderRadius: "0 12px 12px 0",
          padding: "18px 28px",
          marginBottom: 28,
          textAlign: "left",
          width: "100%",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-playfair, serif)",
            fontSize: 19,
            color: "#e8f4ff",
            lineHeight: 1.45,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          "A financial audit — but for AI compliance,
          <br />
          designed for early-stage teams."
        </p>
      </div>
      <p
        style={{
          fontSize: 18,
          color: "#c8a84b",
          fontFamily: "var(--font-playfair, serif)",
          fontWeight: 500,
        }}
      >
        That is the gap LexSutra fills.
      </p>
    </ProblemSlide>
  );
}

// ─── Slide 08 — What LexSutra is ─────────────────────────────────────────────
function S08WhatWeAre() {
  const items = [
    {
      n: "01",
      q: "Are we high-risk?",
      desc: "Understand your classification before building further.",
    },
    {
      n: "02",
      q: "Where are we exposed?",
      desc: "Identify obligation gaps across 8 EU AI Act diagnostic areas.",
    },
    {
      n: "03",
      q: "What do we fix first?",
      desc: "Prioritised roadmap with legal citations and remediation steps.",
    },
  ];
  return (
    <Slide>
      <Label>What LexSutra Is</Label>
      <h2
        style={{
          fontFamily: "var(--font-playfair, serif)",
          fontSize: "clamp(22px, 3.5vw, 38px)",
          fontWeight: 500,
          color: "#e8f4ff",
          marginBottom: 8,
          lineHeight: 1.25,
        }}
      >
        Not legal advice. Not a law firm.
      </h2>
      <p
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.38)",
          marginBottom: 34,
          maxWidth: 520,
        }}
      >
        A compliance diagnostic system — the missing layer between product teams and
        legal counsel.
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          maxWidth: 620,
        }}
      >
        {items.map((item) => (
          <div
            key={item.n}
            style={{
              display: "flex",
              gap: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              padding: "15px 20px",
              textAlign: "left",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#c8a84b",
                background: "rgba(200,168,75,0.1)",
                border: "1px solid rgba(200,168,75,0.2)",
                borderRadius: 6,
                padding: "3px 8px",
                whiteSpace: "nowrap",
                marginTop: 2,
                flexShrink: 0,
              }}
            >
              {item.n}
            </span>
            <div>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#e8f4ff",
                  margin: "0 0 4px",
                }}
              >
                {item.q}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.38)",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// ─── Slide 09 — How it works ──────────────────────────────────────────────────
function S09HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Public Footprint Scan",
      desc: "We analyse your public website and AI system profile to produce an initial classification and risk summary.",
    },
    {
      n: "02",
      title: "Full Diagnostic Assessment",
      desc: "Structured questionnaire covering 8 EU AI Act obligation areas. Your team answers once. We do the rest.",
    },
    {
      n: "03",
      title: "Graded Report with Roadmap",
      desc: "Colour-coded findings, compliance score, legal citations, and a prioritised remediation roadmap.",
    },
  ];
  return (
    <Slide>
      <Label>How It Works</Label>
      <h2
        style={{
          fontFamily: "var(--font-playfair, serif)",
          fontSize: "clamp(22px, 3.5vw, 38px)",
          fontWeight: 500,
          color: "#e8f4ff",
          marginBottom: 8,
          lineHeight: 1.25,
        }}
      >
        Three steps. Weeks, not months.
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.28)",
          marginBottom: 36,
          letterSpacing: "0.08em",
        }}
      >
        AUDITABLE · VERSION-STAMPED · EXPERT-REVIEWED
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          width: "100%",
          maxWidth: 620,
        }}
      >
        {steps.map((s, i) => (
          <div
            key={s.n}
            style={{
              display: "flex",
              gap: 20,
              alignItems: "flex-start",
              paddingBottom: i < 2 ? 24 : 0,
              position: "relative",
            }}
          >
            {i < 2 && (
              <div
                style={{
                  position: "absolute",
                  left: 19,
                  top: 40,
                  width: 1,
                  height: "calc(100% - 16px)",
                  background: "rgba(255,255,255,0.05)",
                }}
              />
            )}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(200,168,75,0.08)",
                border: "1px solid rgba(200,168,75,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "#c8a84b",
              }}
            >
              {s.n}
            </div>
            <div style={{ paddingTop: 8, textAlign: "left" }}>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#e8f4ff",
                  margin: "0 0 4px",
                }}
              >
                {s.title}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.42)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// ─── Slide 10 — Why now ───────────────────────────────────────────────────────
function S10WhyNow() {
  return (
    <Slide>
      <Label>Why Now</Label>
      <h2
        style={{
          fontFamily: "var(--font-playfair, serif)",
          fontSize: "clamp(22px, 3.5vw, 38px)",
          fontWeight: 500,
          color: "#e8f4ff",
          marginBottom: 10,
          lineHeight: 1.25,
        }}
      >
        The EU AI Act is no longer theory.
      </h2>
      <p
        style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 36 }}
      >
        High-risk AI obligations become enforceable:
      </p>
      <div
        style={{
          background: "rgba(200,168,75,0.06)",
          border: "1px solid rgba(200,168,75,0.28)",
          borderRadius: 16,
          padding: "24px 52px",
          marginBottom: 36,
          display: "inline-block",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-playfair, serif)",
            fontSize: "clamp(30px, 5.5vw, 58px)",
            fontWeight: 600,
            color: "#c8a84b",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          2 August 2026
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          maxWidth: 560,
          width: "100%",
        }}
      >
        <div
          style={{
            background: "rgba(46,204,113,0.04)",
            border: "1px solid rgba(46,204,113,0.18)",
            borderRadius: 10,
            padding: "16px 18px",
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#2ecc71",
              fontWeight: 600,
              letterSpacing: "0.09em",
              margin: "0 0 6px",
            }}
          >
            EARLY START
          </p>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Structured preparation. Decisions made with clarity.
          </p>
        </div>
        <div
          style={{
            background: "rgba(224,82,82,0.04)",
            border: "1px solid rgba(224,82,82,0.18)",
            borderRadius: 10,
            padding: "16px 18px",
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#e05252",
              fontWeight: 600,
              letterSpacing: "0.09em",
              margin: "0 0 6px",
            }}
          >
            LATE START
          </p>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Locked-in decisions. Expensive fixes. No time to remediate.
          </p>
        </div>
      </div>
    </Slide>
  );
}

// ─── Slide 11 — CTA ───────────────────────────────────────────────────────────
function S11Cta() {
  return (
    <Slide>
      <ShieldLogo size={48} />
      <h1
        style={{
          fontFamily: "var(--font-playfair, serif)",
          fontSize: "clamp(28px, 5vw, 52px)",
          fontWeight: 600,
          color: "#e8f4ff",
          margin: "20px 0 10px",
          lineHeight: 1.2,
        }}
      >
        Ready to understand
        <br />
        where you stand?
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.38)",
          marginBottom: 40,
          maxWidth: 460,
          lineHeight: 1.7,
        }}
      >
        Start with a free public footprint analysis — no forms, no commitment.
        <br />
        Understand your position before it becomes a problem.
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "center",
        }}
      >
        <a
          href="/"
          style={{
            background: "#c8a84b",
            color: "#080c14",
            fontSize: 15,
            fontWeight: 700,
            borderRadius: 10,
            padding: "14px 44px",
            textDecoration: "none",
            letterSpacing: "0.02em",
            display: "inline-block",
            transition: "background 0.2s",
          }}
        >
          Request Your Diagnostic →
        </a>
        <a
          href="mailto:hello@lexsutra.com"
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.3)",
            textDecoration: "none",
          }}
        >
          hello@lexsutra.com
        </a>
      </div>
    </Slide>
  );
}

// ─── Main deck ────────────────────────────────────────────────────────────────
const TOTAL = 11;

const SLIDES = [
  S01Title,
  S02Insight,
  S03ProblemOverview,
  S04Problem1,
  S05Problem2,
  S06Problem3,
  S07Problem4,
  S08WhatWeAre,
  S09HowItWorks,
  S10WhyNow,
  S11Cta,
];

export default function DeckPage() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dir, setDir] = useState<1 | -1>(1);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === current || idx < 0 || idx >= TOTAL) return;
      setDir(idx > current ? 1 : -1);
      setVisible(false);
      setTimeout(() => {
        setCurrent(idx);
        setVisible(true);
      }, 200);
    },
    [current]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const CurrentSlide = SLIDES[current];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080c14",
        color: "#e8f4ff",
        fontFamily:
          "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
        overflow: "hidden",
        userSelect: "none",
        zIndex: 10,
      }}
    >
      {/* Slide area */}
      <div
        style={{
          height: "100%",
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateX(0)"
            : dir > 0
            ? "translateX(-18px)"
            : "translateX(18px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        <CurrentSlide />
      </div>

      {/* Bottom nav bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          borderTop: "1px solid rgba(255,255,255,0.04)",
          background: "rgba(8,12,20,0.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Prev */}
        <button
          onClick={prev}
          disabled={current === 0}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            color:
              current === 0 ? "rgba(255,255,255,0.18)" : "#e8f4ff",
            cursor: current === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            transition: "all 0.2s",
          }}
        >
          ←
        </button>

        {/* Progress dots */}
        <div
          style={{ display: "flex", gap: 5, alignItems: "center" }}
        >
          {Array.from({ length: TOTAL }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              title={`Slide ${i + 1}`}
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background:
                  i === current
                    ? "#c8a84b"
                    : i < current
                    ? "rgba(200,168,75,0.28)"
                    : "rgba(255,255,255,0.1)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.25s ease",
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={next}
          disabled={current === TOTAL - 1}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border:
              current === TOTAL - 1
                ? "1px solid rgba(255,255,255,0.05)"
                : "1px solid rgba(200,168,75,0.32)",
            background:
              current === TOTAL - 1
                ? "rgba(255,255,255,0.02)"
                : "rgba(200,168,75,0.09)",
            color:
              current === TOTAL - 1
                ? "rgba(255,255,255,0.15)"
                : "#c8a84b",
            cursor:
              current === TOTAL - 1 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            transition: "all 0.2s",
          }}
        >
          →
        </button>

        {/* Slide counter */}
        <span
          style={{
            position: "absolute",
            right: 22,
            fontSize: 11,
            color: "rgba(255,255,255,0.18)",
            fontFamily: "monospace",
            letterSpacing: "0.05em",
          }}
        >
          {current + 1} / {TOTAL}
        </span>
      </div>
    </div>
  );
}
