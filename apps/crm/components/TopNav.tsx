"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/crm/prospects", label: "Prospects" },
  { href: "/crm/jobs", label: "Jobs" },
  { href: "/crm/icp", label: "ICP Config" },
];

export default function TopNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          height: 52,
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--accent-blue)",
            whiteSpace: "nowrap",
          }}
        >
          LexSutra CRM
        </span>

        {/* Nav tabs */}
        <div style={{ display: "flex", gap: "0.25rem", flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "0.375rem 0.875rem",
                  borderRadius: 6,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: active ? "var(--accent-blue)" : "var(--text-muted)",
                  background: active ? "rgba(45,156,219,0.1)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{userEmail}</span>
          <button onClick={handleSignOut} className="btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
