"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors"
      style={{ color: "#8899aa" }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.color = "#8899aa")
      }
    >
      <LogOut className="w-4 h-4 shrink-0" />
      Sign out
    </button>
  );
}
