"use client";

import { useEffect, useState } from "react";

// Network status chip: a glowing LED and the network name, playground-style.
// The LED reflects the live graph status from /api/status (green OK, red
// down, muted while checking); real or absent, never faked.
export default function NetworkChip({ label }: { label: string }) {
  const [graph, setGraph] = useState<"ok" | "down" | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setGraph(d.graph === "ok" ? "ok" : "down");
      })
      .catch(() => {
        if (alive) setGraph("down");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <span
      className="chip"
      title={`Searching the Verana ${label.toLowerCase()} trust graph${
        graph === "down" ? " (graph unreachable right now)" : ""
      }`}
    >
      <span
        aria-hidden
        className={`led ${
          graph === "ok" ? "led-green" : graph === "down" ? "led-red" : "led-idle"
        }`}
      />
      {label}
    </span>
  );
}
