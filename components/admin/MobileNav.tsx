"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button — only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg"
        style={{ color: "#8899aa" }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(6,8,16,0.7)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in sidebar */}
      <div
        className="fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-200"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="relative h-full">
          <AdminSidebar />
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8899aa" }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
