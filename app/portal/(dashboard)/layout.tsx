// TODO: re-enable auth before production
import { ClientSidebar } from "@/components/portal/ClientSidebar";
import { MobileNav } from "@/components/portal/MobileNav";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companyName = "Test Company";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080c14" }}>
      <div className="hidden md:block">
        <ClientSidebar companyName={companyName} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div
          className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0"
          style={{
            background:   "rgba(6,8,16,0.95)",
            borderBottom: "1px solid rgba(45,156,219,0.12)",
          }}
        >
          <div className="flex items-center gap-3">
            <MobileNav companyName={companyName} />
            <span className="text-sm hidden sm:block" style={{ color: "#8899aa" }}>
              Welcome back
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: "#2ecc71" }} />
            <span className="text-xs" style={{ color: "#3d4f60" }}>
              test@lexsutra.nl
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
