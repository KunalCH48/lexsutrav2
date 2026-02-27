"use client";

import { useTransition } from "react";
import { updateDemoStatus } from "@/app/admin/(dashboard)/demo-requests/actions";

const OPTIONS = ["pending", "contacted", "converted", "rejected"] as const;
type DemoStatus = (typeof OPTIONS)[number];

interface StatusDropdownProps {
  id: string;
  current: string;
}

export function StatusDropdown({ id, current }: StatusDropdownProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as DemoStatus;
    startTransition(async () => {
      await updateDemoStatus(id, newStatus);
    });
  }

  return (
    <select
      defaultValue={current}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs rounded-lg px-2.5 py-1.5 transition disabled:opacity-50 cursor-pointer"
      style={{
        background: "#0a1120",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#e2e8f0",
      }}
    >
      {OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {isPending ? "Saving…" : opt.charAt(0).toUpperCase() + opt.slice(1)}
        </option>
      ))}
    </select>
  );
}
