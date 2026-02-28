"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function ClientSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
      style={{ color: "#3d4f60" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#e8f4ff")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#3d4f60")}
    >
      <LogOut size={15} />
      Sign out
    </button>
  );
}
