export default function AdminLoading() {
  return (
    <div className="max-w-6xl space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-4 w-32 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="h-9 w-28 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 space-y-2"
            style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-8 w-16 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Table header */}
        <div
          className="px-5 py-3 flex gap-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {[40, 24, 16, 12].map((w, i) => (
            <div key={i} className={`h-3 w-${w} rounded`} style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
        {/* Table rows */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="px-5 py-4 flex items-center gap-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div className="h-4 w-40 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-4 w-28 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-4 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="ml-auto h-6 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
