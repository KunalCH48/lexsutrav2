import Link from "next/link";

type Props = {
  companyWebsite: string | null;
  aiSystemCount: number;
  documentCount: number;
  diagnosticCount: number;
  hasDeliveredReport: boolean;
};

type Step = {
  label: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

const STEPS: Step[] = [
  {
    label: "Complete your company profile",
    description: "Add your website so we can tailor your diagnostic.",
    ctaLabel: "Complete now",
    ctaHref: "/portal/profile",
  },
  {
    label: "Add your AI system",
    description: "Register the AI system you want assessed.",
    ctaLabel: "Add system",
    ctaHref: "/portal/profile",
  },
  {
    label: "Upload documents",
    description: "Upload supporting documents for your assessment.",
    ctaLabel: "Upload now",
    ctaHref: "/portal/documents",
  },
  {
    label: "Request your diagnostic",
    description: "Submit a request — our team will set up your diagnostic within 24 hours.",
    ctaLabel: "Request diagnostic",
    ctaHref: "/portal/diagnostics",
  },
  {
    label: "Await your report",
    description: "Our experts will review and deliver your report.",
    ctaLabel: "View reports",
    ctaHref: "/portal/reports",
  },
];

function getCompletedSteps(props: Props): boolean[] {
  return [
    !!props.companyWebsite,
    props.aiSystemCount > 0,
    props.documentCount > 0,
    props.diagnosticCount > 0,
    props.hasDeliveredReport,
  ];
}

export function OnboardingProgress(props: Props) {
  // Hide entirely once all steps are done (delivered report exists)
  if (props.hasDeliveredReport) return null;

  const completed = getCompletedSteps(props);
  const allDone = completed.every(Boolean);

  // Find first incomplete step (0-based index)
  const currentIndex = completed.findIndex((c) => !c);

  if (allDone) {
    return (
      <div
        className="rounded-xl px-5 py-4 flex items-center gap-3"
        style={{
          background: "rgba(46,204,113,0.06)",
          border: "1px solid rgba(46,204,113,0.2)",
        }}
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
          style={{ background: "rgba(46,204,113,0.15)", color: "#2ecc71" }}
        >
          ✓
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#2ecc71" }}>
            You&apos;re all set
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#8899aa" }}>
            All setup steps are complete. Your diagnostic is underway.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{
        background: "#0d1520",
        border: "1px solid rgba(45,156,219,0.15)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#2d9cdb" }}
        >
          Setup Checklist
        </p>
        <p className="text-xs" style={{ color: "#3d4f60" }}>
          {completed.filter(Boolean).length} of {STEPS.length} complete
        </p>
      </div>

      {/* Step row */}
      <div className="flex items-start gap-0 overflow-x-auto">
        {STEPS.map((step, i) => {
          const isDone = completed[i];
          const isCurrent = i === currentIndex;

          return (
            <div key={i} className="flex items-start flex-1 min-w-0">
              {/* Step content */}
              <div className="flex flex-col items-center flex-1 min-w-0 px-1">
                {/* Circle */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                  style={
                    isDone
                      ? {
                          background: "rgba(46,204,113,0.15)",
                          border: "2px solid #2ecc71",
                          color: "#2ecc71",
                        }
                      : isCurrent
                      ? {
                          background: "rgba(45,156,219,0.12)",
                          border: "2px solid #2d9cdb",
                          color: "#2d9cdb",
                        }
                      : {
                          background: "transparent",
                          border: "2px solid rgba(255,255,255,0.1)",
                          color: "#3d4f60",
                        }
                  }
                >
                  {isDone ? "✓" : i + 1}
                </div>

                {/* Label + description + CTA */}
                <div className="mt-2 text-center min-w-0 w-full">
                  <p
                    className="text-xs font-semibold leading-tight"
                    style={{
                      color: isDone
                        ? "#2ecc71"
                        : isCurrent
                        ? "#e8f4ff"
                        : "#3d4f60",
                    }}
                  >
                    {step.label}
                  </p>

                  {isCurrent && (
                    <>
                      <p
                        className="text-xs mt-1 leading-tight hidden sm:block"
                        style={{ color: "#8899aa" }}
                      >
                        {step.description}
                      </p>
                      <Link
                        href={step.ctaHref}
                        className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                        style={{
                          background: "rgba(45,156,219,0.12)",
                          color: "#2d9cdb",
                          border: "1px solid rgba(45,156,219,0.25)",
                        }}
                      >
                        {step.ctaLabel} →
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Connector line (between steps) */}
              {i < STEPS.length - 1 && (
                <div
                  className="h-0.5 flex-shrink-0 mt-3.5"
                  style={{
                    width: "24px",
                    background: completed[i]
                      ? "rgba(46,204,113,0.4)"
                      : "rgba(255,255,255,0.06)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
