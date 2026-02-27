"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function SidebarLink({ href, label, icon: Icon, exact = false }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
      style={{
        color: isActive ? "#2d9cdb" : "rgba(232,244,255,0.5)",
        background: isActive ? "rgba(45,156,219,0.12)" : "transparent",
        borderLeft: isActive ? "2px solid #2d9cdb" : "2px solid transparent",
      }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}
