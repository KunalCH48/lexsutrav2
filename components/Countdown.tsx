"use client";

import { useState, useEffect } from "react";

const DEADLINE = new Date("2026-08-02T23:59:59Z");

function getTime() {
  const diff = DEADLINE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

export function Countdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(getTime());
    const id = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  const units = [
    { label: "DAYS", value: time.days },
    { label: "HRS",  value: time.hours },
    { label: "MIN",  value: time.minutes },
    { label: "SEC",  value: time.seconds },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-2 sm:gap-3">
          <div className="text-center min-w-[44px]">
            <div
              className="text-2xl font-bold leading-none tabular-nums"
              style={{ color: "#dbbf6a", fontVariantNumeric: "tabular-nums" }}
            >
              {String(value).padStart(2, "0")}
            </div>
            <div className="text-[9px] tracking-widest mt-1" style={{ color: "#6b7280" }}>
              {label}
            </div>
          </div>
          {i < 3 && (
            <span
              className="text-xl font-bold animate-pulse"
              style={{ color: "#c9a84c" }}
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
