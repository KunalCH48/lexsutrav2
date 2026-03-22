// Shared LexSutra logo — shield icon + full-gold wordmark
// Use size="sm" in sidebars/navbars, size="md" for larger placements

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { icon: number; text: string; gap: string }> = {
  sm: { icon: 26, text: "17px", gap: "8px"  },
  md: { icon: 32, text: "20px", gap: "10px" },
  lg: { icon: 42, text: "26px", gap: "13px" },
};

export function Logo({ size = "sm" }: { size?: Size }) {
  const { icon, text, gap } = SIZES[size];

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, userSelect: "none" }}>
      {/* Shield + neural network — transparent background */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Shield outline */}
        <path
          d="M32 6 L56 15 L56 35 Q56 52 32 61 Q8 52 8 35 L8 15 Z"
          stroke="#c8a84b"
          strokeWidth="2.5"
          fill="rgba(200,168,75,0.06)"
          strokeLinejoin="round"
        />
        {/* Central neural node (gold) */}
        <circle cx="32" cy="28" r="4" fill="#c8a84b" />
        {/* Outer nodes (blue) */}
        <circle cx="19" cy="21" r="2.5" fill="#2d9cdb" />
        <circle cx="45" cy="21" r="2.5" fill="#2d9cdb" />
        <circle cx="19" cy="37" r="2.5" fill="#2d9cdb" />
        <circle cx="45" cy="37" r="2.5" fill="#2d9cdb" />
        <circle cx="32" cy="46" r="2"   fill="#2d9cdb" opacity="0.65" />
        {/* Connections to centre */}
        <line x1="19" y1="21" x2="32" y2="28" stroke="#2d9cdb" strokeWidth="1.2" opacity="0.5" />
        <line x1="45" y1="21" x2="32" y2="28" stroke="#2d9cdb" strokeWidth="1.2" opacity="0.5" />
        <line x1="19" y1="37" x2="32" y2="28" stroke="#2d9cdb" strokeWidth="1.2" opacity="0.5" />
        <line x1="45" y1="37" x2="32" y2="28" stroke="#2d9cdb" strokeWidth="1.2" opacity="0.5" />
        <line x1="32" y1="46" x2="32" y2="32"  stroke="#2d9cdb" strokeWidth="1.2" opacity="0.4" />
        {/* Cross-connections */}
        <line x1="19" y1="21" x2="45" y2="21" stroke="#2d9cdb" strokeWidth="0.8" opacity="0.28" />
        <line x1="19" y1="37" x2="45" y2="37" stroke="#2d9cdb" strokeWidth="0.8" opacity="0.28" />
        <line x1="19" y1="21" x2="19" y2="37" stroke="#2d9cdb" strokeWidth="0.8" opacity="0.28" />
        <line x1="45" y1="21" x2="45" y2="37" stroke="#2d9cdb" strokeWidth="0.8" opacity="0.28" />
      </svg>

      {/* Wordmark — full gold */}
      <span
        style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: text,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "0.01em",
          color: "#c8a84b",
        }}
      >
        LexSutra
      </span>
    </span>
  );
}
