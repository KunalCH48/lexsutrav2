import Link from "next/link";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  baseHref: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  baseHref,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs" style={{ color: "#3d4f60" }}>
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link
            href={`${baseHref}?page=${prevPage}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium btn-outline-dark"
          >
            ← Previous
          </Link>
        ) : (
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-medium opacity-30 cursor-not-allowed"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}
          >
            ← Previous
          </span>
        )}

        {currentPage < totalPages ? (
          <Link
            href={`${baseHref}?page=${nextPage}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium btn-gold"
          >
            Next →
          </Link>
        ) : (
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-medium opacity-30 cursor-not-allowed btn-gold"
          >
            Next →
          </span>
        )}
      </div>
    </div>
  );
}
