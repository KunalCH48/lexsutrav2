interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable({ headers, children, emptyMessage = "No records found." }: DataTableProps) {
  return (
    <div
      className="rounded-xl overflow-hidden card-hover"
      style={{ background: "#0d1827", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#3d4f60" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <td
      className="px-4 py-3"
      style={{ color: muted ? "#3d4f60" : "#e2e8f0" }}
    >
      {children}
    </td>
  );
}
