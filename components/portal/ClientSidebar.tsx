import { LayoutDashboard, FolderOpen, ClipboardList, FileText, Building2 } from "lucide-react";
import { SidebarLink } from "@/components/admin/SidebarLink";
import { ClientSignOutButton } from "./ClientSignOutButton";

const NAV_ITEMS = [
  { href: "/portal",           label: "Dashboard",   icon: LayoutDashboard, exact: true  },
  { href: "/portal/documents", label: "Documents",   icon: FolderOpen,      exact: false },
  { href: "/portal/diagnostics", label: "Diagnostics", icon: ClipboardList, exact: false },
  { href: "/portal/reports",   label: "Reports",     icon: FileText,        exact: false },
  { href: "/portal/profile",   label: "Company",     icon: Building2,       exact: false },
];

type Props = {
  companyName: string;
};

export function ClientSidebar({ companyName }: Props) {
  return (
    <aside
      className="w-60 h-screen flex flex-col shrink-0 sticky top-0"
      style={{ background: "#060810", borderRight: "1px solid rgba(45,156,219,0.15)" }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center px-6 shrink-0"
        style={{ borderBottom: "1px solid rgba(45,156,219,0.15)" }}
      >
        <span className="text-lg font-serif font-bold" style={{ color: "#2d9cdb" }}>Lex</span>
        <span className="text-lg font-serif font-bold" style={{ color: "#e8f4ff" }}>Sutra</span>
      </div>

      {/* Company badge */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="px-3 py-2 rounded-lg"
          style={{ background: "rgba(45,156,219,0.06)", border: "1px solid rgba(45,156,219,0.12)" }}
        >
          <p className="text-xs font-medium truncate" style={{ color: "#e8f4ff" }}>
            {companyName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>Client Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Sign out */}
      <div
        className="px-3 pb-4 pt-3"
        style={{ borderTop: "1px solid rgba(45,156,219,0.15)" }}
      >
        <ClientSignOutButton />
      </div>
    </aside>
  );
}
