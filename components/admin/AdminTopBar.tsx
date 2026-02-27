interface AdminTopBarProps {
  title: string;
}

export function AdminTopBar({ title }: AdminTopBarProps) {
  return (
    <header
      className="h-14 flex items-center px-6 shrink-0"
      style={{
        background: "#0a1120",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <h1 className="text-sm font-semibold text-white">{title}</h1>
    </header>
  );
}
