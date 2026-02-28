// TODO: re-enable auth before production
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileNav } from "@/components/admin/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080c14" }}>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top admin bar */}
        <div
          className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0"
          style={{
            background:   "rgba(6,8,16,0.95)",
            borderBottom: "1px solid rgba(224,82,82,0.2)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <MobileNav />
            <span className="text-sm font-semibold tracking-widest" style={{ color: "#e05252" }}>
              ⚡ ADMIN MODE
            </span>
          </div>
          <span className="text-xs hidden sm:block" style={{ color: "rgba(232,244,255,0.4)" }}>
            LexSutra Internal · Founder
          </span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
