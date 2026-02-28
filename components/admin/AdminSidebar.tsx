import {
  LayoutDashboard,
  Inbox,
  ClipboardList,
  Users,
  BookOpen,
  AlertTriangle,
  ScrollText,
  DollarSign,
} from "lucide-react";
import { SidebarLink } from "./SidebarLink";
import { SignOutButton } from "./SignOutButton";

const OPERATIONS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/demo-requests", label: "Demo Queue", icon: Inbox, exact: false },
  { href: "/admin/diagnostics", label: "Diagnostic Queue", icon: ClipboardList, exact: false },
  { href: "/admin/companies", label: "All Clients", icon: Users, exact: false },
];

const PLATFORM = [
  { href: "/admin/policy-versions", label: "Policy Versions", icon: BookOpen,       exact: false },
  { href: "/admin/errors",          label: "Error Logs",      icon: AlertTriangle,  exact: false },
  { href: "/admin/activity",        label: "Activity Logs",   icon: ScrollText,     exact: false },
  { href: "/admin/revenue",         label: "Revenue",         icon: DollarSign,     exact: false },
];

export function AdminSidebar() {
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
        <span className="text-lg font-serif font-bold" style={{ color: "#2d9cdb" }}>
          Lex
        </span>
        <span className="text-lg font-serif font-bold text-white">Sutra</span>
      </div>

      {/* Admin badge */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="text-center py-1.5 rounded text-xs font-medium tracking-widest uppercase"
          style={{
            background: "rgba(224,82,82,0.1)",
            border: "1px solid rgba(224,82,82,0.2)",
            color: "#e05252",
          }}
        >
          Admin Access
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <p
          className="px-3 pt-3 pb-1 text-xs font-medium tracking-widest uppercase"
          style={{ color: "rgba(232,244,255,0.3)" }}
        >
          Operations
        </p>
        <div className="space-y-0.5 mb-4">
          {OPERATIONS.map((item) => (
            <SidebarLink key={item.href} {...item} />
          ))}
        </div>

        <p
          className="px-3 pt-3 pb-1 text-xs font-medium tracking-widest uppercase"
          style={{ color: "rgba(232,244,255,0.3)" }}
        >
          Platform
        </p>
        <div className="space-y-0.5">
          {PLATFORM.map((item) => (
            <SidebarLink key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* Sign out */}
      <div
        className="px-3 pb-4 pt-3"
        style={{ borderTop: "1px solid rgba(45,156,219,0.15)" }}
      >
        <SignOutButton />
      </div>
    </aside>
  );
}
