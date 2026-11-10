"use client";

import { useEffect, useState } from "react";
import { Check, Globe, Loader2, MapPin, ShieldCheck, Sparkles, Wand2 } from "lucide-react";

/** Scripted demo of one Lead Hunter run. Illustration only — fictional businesses, example data. */
const PROMPT = "Find bakeries in Austin with weak Instagram visuals";

const STEPS = [
  { icon: MapPin, label: "Scanning Google Maps · Austin, TX" },
  { icon: Globe, label: "Reading websites & social profiles" },
  { icon: Wand2, label: "Scoring visual content gaps" },
  { icon: ShieldCheck, label: "Policy check · suppression & send limits" },
];

const LEADS = [
  { name: "Golden Crumb Bakery", gap: "No reels in 90 days", score: 92 },
  { name: "Rise & Knead Co.", gap: "Low-res product photos", score: 86 },
  { name: "Little Oven Studio", gap: "Inconsistent branding", score: 78 },
];

// Timeline (ms after the prompt finishes typing)
const STEP_GAP = 900;
const LEADS_AT = STEPS.length * STEP_GAP + 300;
const LEAD_GAP = 450;
const DONE_AT = LEADS_AT + LEADS.length * LEAD_GAP + 400;
const RESTART_AT = DONE_AT + 4200;

export default function AIConsole() {
  const [typed, setTyped] = useState(0);
  const [t, setT] = useState(-1); // ms since typing finished; -1 = still typing
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(PROMPT.length);
      setT(RESTART_AT - 1);
      return;
    }
    setTyped(0);
    setT(-1);
    let i = 0;
    const typing = setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= PROMPT.length) {
        clearInterval(typing);
        const start = performance.now();
        const tick = setInterval(() => {
          const now = performance.now() - start;
          setT(now);
          if (now >= RESTART_AT) {
            clearInterval(tick);
            setRun((r) => r + 1);
          }
        }, 100);
        cleanup.push(() => clearInterval(tick));
      }
    }, 38);
    const cleanup: (() => void)[] = [() => clearInterval(typing)];
    return () => cleanup.forEach((fn) => fn());
  }, [run]);

  const stepState = (idx: number) => {
    if (t < 0) return "idle";
    const at = idx * STEP_GAP;
    if (t >= at + STEP_GAP) return "done";
    if (t >= at) return "active";
    return "idle";
  };
  const leadsShown = t < LEADS_AT ? 0 : Math.min(LEADS.length, Math.floor((t - LEADS_AT) / LEAD_GAP) + 1);
  const done = t >= DONE_AT;

  return (
    <div className="fx-beam shadow-[0_40px_120px_-40px_rgba(140,120,255,0.45)]">
      <div className="fx-beam-inner relative overflow-hidden">
        <div className="fx-scan" aria-hidden="true" />

        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="ml-3 flex items-center gap-1.5 font-mono text-[11px] text-faint">
            <Sparkles className="size-3 text-white/70" aria-hidden="true" />
            miracle · lead-hunter agent
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted">
            <span className="relative grid size-2 place-items-center">
              <span className="fx-pulse-ring" />
              <span className="size-2 rounded-full bg-[#6ad8ff]" />
            </span>
            live
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5" aria-label="Example AI run (illustration)">
          {/* prompt */}
          <div className="glass rounded-2xl px-4 py-3">
            <p className="text-[11px] font-medium tracking-wide text-faint uppercase">You</p>
            <p className="mt-1 min-h-[1.5rem] text-[15px] text-fg">
              {PROMPT.slice(0, typed)}
              {t < 0 ? <span className="fx-caret" aria-hidden="true" /> : null}
            </p>
          </div>

          {/* agent steps */}
          <ul className="space-y-2">
            {STEPS.map(({ icon: Icon, label }, idx) => {
              const s = stepState(idx);
              return (
                <li
                  key={label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all duration-500 ${
                    s === "idle" ? "opacity-30" : "opacity-100"
                  } ${s === "active" ? "bg-white/[0.06]" : ""}`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
                    <Icon className="size-3.5 text-white/80" aria-hidden="true" />
                  </span>
                  <span className={s === "active" ? "text-shine font-medium" : "text-muted"}>{label}</span>
                  <span className="ml-auto">
                    {s === "active" ? <Loader2 className="size-4 animate-spin text-white/70" aria-hidden="true" /> : null}
                    {s === "done" ? <Check className="size-4 text-[#6ad8ff]" aria-hidden="true" /> : null}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* leads */}
          <div className="space-y-2">
            {LEADS.slice(0, leadsShown).map((l) => (
              <div
                key={l.name}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                style={{ animation: "fx-row-in 500ms cubic-bezier(.2,.7,.2,1) both" }}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-white/25 to-white/5 text-[11px] font-semibold text-fg">
                  {l.name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-fg">{l.name}</p>
                  <p className="truncate text-[11px] text-faint">{l.gap}</p>
                </div>
                <div className="w-20 shrink-0 sm:w-24">
                  <div className="flex justify-between text-[10px] text-faint">
                    <span>fit</span>
                    <span className="text-fg">{l.score}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full origin-left rounded-full bg-gradient-to-r from-[#9d8cff] via-white to-[#6ad8ff]"
                      style={{ width: `${l.score}%`, animation: "fx-bar 900ms cubic-bezier(.2,.7,.2,1) both" }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {leadsShown === 0 ? <div className="h-[9.5rem] rounded-xl border border-dashed border-white/10" aria-hidden="true" /> : null}
          </div>

          {/* result */}
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] transition-all duration-700 ${
              done ? "border-[#6ad8ff]/30 bg-[#6ad8ff]/[0.07] text-[#a8e8ff] opacity-100" : "border-transparent opacity-0"
            }`}
          >
            <Sparkles className="size-4 shrink-0" aria-hidden="true" />
            3 personalized hooks drafted — waiting for your approval
          </div>
        </div>
      </div>
    </div>
  );
}
