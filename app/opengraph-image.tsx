import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LexSutra — EU AI Act Compliance Diagnostics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080c14",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(45,156,219,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(45,156,219,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Gold top border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #080c14, #c8a84b, #080c14)",
          }}
        />

        {/* Shield logo SVG */}
        <svg
          width="72"
          height="86"
          viewBox="0 0 40 48"
          fill="none"
          style={{ marginBottom: 24 }}
        >
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

        {/* Wordmark */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: "#e8f4ff",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          LexSutra
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "#2d9cdb",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          EU AI Act Compliance Diagnostics
        </div>

        {/* Divider */}
        <div
          style={{
            width: 60,
            height: 1,
            background: "rgba(200,168,75,0.5)",
            marginBottom: 40,
          }}
        />

        {/* Pills row */}
        <div style={{ display: "flex", gap: 16 }}>
          {["Structured Diagnostic", "Expert Reviewed", "August 2026 Deadline"].map(
            (label) => (
              <div
                key={label}
                style={{
                  background: "rgba(45,156,219,0.08)",
                  border: "1px solid rgba(45,156,219,0.2)",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontSize: 18,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            fontSize: 18,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "2px",
          }}
        >
          lexsutra.com
        </div>
      </div>
    ),
    { ...size }
  );
}
