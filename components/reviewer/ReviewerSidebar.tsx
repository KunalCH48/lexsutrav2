"use client";

import { ClipboardList, Users } from "lucide-react";
import { SidebarLink } from "@/components/admin/SidebarLink";
import { SignOutButton } from "@/components/admin/SignOutButton";

const LINKS = [
  { href: "/reviewer/clients",     label: "My Clients",      icon: Users,         exact: false },
  { href: "/reviewer/diagnostics", label: "Diagnostics",     icon: ClipboardList, exact: false },
];

export function ReviewerSidebar() {
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
        <span className="text-lg font-serif font-bold text-white">Sutra</span>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="text-center py-1.5 rounded text-xs font-medium tracking-widest uppercase"
          style={{
            background: "rgba(45,156,219,0.1)",
            border:     "1px solid rgba(45,156,219,0.2)",
            color:      "#2d9cdb",
          }}
        >
          Reviewer Access
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="space-y-0.5 mt-2">
          {LINKS.map((item) => (
            <SidebarLink key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: "1px solid rgba(45,156,219,0.15)" }}>
        <SignOutButton />
      </div>
    </aside>
  );
}
