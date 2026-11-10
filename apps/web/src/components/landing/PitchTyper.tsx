"use client";

import { useEffect, useState } from "react";

const PITCHES = [
  "Hi Sara — loved the new sourdough line, but the last reel on your Instagram was in March. We could turn this week’s bakes into 3 short reels.",
  "Hi Omar — your gym’s site takes 6 seconds to open on a phone. We rebuild sites like yours to load in under 2, with online class booking.",
  "Hi Lena — your salon photos look great in person, but the logo changes across Google, Instagram and the menu. A simple brand kit would fix it.",
];

/** Types out example pitch lines one after another. Illustration only. */
export default function PitchTyper() {
  const [idx, setIdx] = useState(0);
  const [len, setLen] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLen(PITCHES[idx].length);
      return;
    }
    const full = PITCHES[idx].length;
    if (len < full) {
      const t = setTimeout(() => setLen((l) => l + 1), 22);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setIdx((i) => (i + 1) % PITCHES.length);
      setLen(0);
    }, 2600);
    return () => clearTimeout(t);
  }, [idx, len]);

  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 p-5 sm:p-6">
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {["Instagram: no reels since March", "New product line", "Austin · Bakery"].map((t) => (
          <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-faint">
            evidence · {t}
          </span>
        ))}
      </div>
      <p className="min-h-[4.5rem] text-[15px] leading-relaxed text-fg sm:text-base">
        {PITCHES[idx].slice(0, len)}
        <span className="fx-caret" aria-hidden="true" />
      </p>
      <span className="self-start rounded-full bg-amber-300/15 px-2.5 py-1 text-[10px] font-semibold text-amber-100">
        Waiting for your approval
      </span>
    </div>
  );
}
