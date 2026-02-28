"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ClientSidebar } from "./ClientSidebar";

export function MobileNav({ companyName }: { companyName: string }) {
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg"
        style={{ color: "#8899aa" }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(6,8,16,0.7)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className="fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-200"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="relative h-full">
          <ClientSidebar companyName={companyName} />
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
