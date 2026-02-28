export default function PortalLoading() {
  return (
    <div className="max-w-4xl space-y-6 animate-pulse">
      {/* Page heading */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-4 w-36 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 space-y-3"
            style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-9 w-14 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        ))}
      </div>

      {/* Content rows */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="px-5 py-4 flex items-center justify-between gap-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
