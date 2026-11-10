"use client";

import type { PointerEvent, ReactNode } from "react";

/** Moves a soft light under the pointer on every `.fx-spot` card inside it. */
export default function SpotlightGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    for (const card of e.currentTarget.querySelectorAll<HTMLElement>(".fx-spot")) {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
      card.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
    }
  };
  return (
    <div className={className} onPointerMove={onMove}>
      {children}
    </div>
  );
}
