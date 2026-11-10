import Link from "next/link";
import { ArrowRight, Lock, Power, ShieldCheck, Sparkles } from "lucide-react";
import AIConsole from "./AIConsole";

const TRUST = [
  { icon: ShieldCheck, label: "Evidence-backed data" },
  { icon: Lock, label: "Policy-controlled AI" },
  { icon: Power, label: "Kill switch built in" },
];

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* backdrop: grid + drifting aurora + spinning AI core + grain */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black,transparent)]" />
        <div className="fx-aurora -top-40 left-[-10%] h-[520px] w-[620px] bg-[#6d5dfc] max-sm:opacity-30" />
        <div
          className="fx-aurora top-10 right-[-12%] h-[460px] w-[560px] bg-[#2bb8e8] max-sm:hidden"
          style={{ animationDelay: "-6s", opacity: 0.35 }}
        />
        <div
          className="fx-aurora bottom-[-30%] left-[30%] h-[420px] w-[520px] bg-white"
          style={{ animationDelay: "-11s", opacity: 0.12 }}
        />
        <div className="fx-orb absolute top-[18%] left-[72%] hidden h-[520px] w-[520px] -translate-x-1/2 xl:block" />
        <div className="fx-noise absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
      </div>

      <div className="mx-auto grid max-w-page items-center gap-14 px-4 pt-16 pb-24 sm:px-6 sm:pt-24 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-16 xl:pt-20 xl:pb-32">
        <div className="text-center xl:text-left">
          <span
            className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted"
            style={{ animation: "fx-row-in 700ms ease both" }}
          >
            <span className="relative grid size-2 place-items-center">
              <span className="fx-pulse-ring" />
              <span className="size-1.5 rounded-full bg-white" />
            </span>
            <span className="text-shine">AI Sales Operating System</span>
            <Sparkles className="size-3.5 text-white/80" aria-hidden="true" />
          </span>

          <h1
            id="hero-title"
            className="mt-7 text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-fg sm:text-6xl lg:text-7xl xl:text-[4.4rem]"
            style={{ animation: "fx-row-in 900ms 120ms cubic-bezier(.2,.7,.2,1) both" }}
          >
            Find every lead in your market.{" "}
            <span className="text-gradient">Let AI work them — safely.</span>
          </h1>

          <p
            className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-pretty text-muted sm:text-lg xl:mx-0"
            style={{ animation: "fx-row-in 900ms 240ms cubic-bezier(.2,.7,.2,1) both" }}
          >
            Miracle maps your entire client market across Google Maps and LinkedIn, detects visual content gaps, and runs
            personalized outreach through to booked discovery calls.
          </p>

          <div
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center xl:justify-start"
            style={{ animation: "fx-row-in 900ms 360ms cubic-bezier(.2,.7,.2,1) both" }}
          >
            <Link
              href="/lead-hunter"
              className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-6 text-[15px] font-semibold text-black shadow-[0_0_40px_-8px_rgba(170,160,255,0.7)] transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#c7c3ff]/60 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
              <span className="relative">Start hunting leads</span>
              <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="glass inline-flex h-12 w-full items-center justify-center rounded-2xl px-6 text-[15px] font-medium text-fg transition-colors hover:bg-white/10 sm:w-auto"
            >
              See how it works
            </a>
          </div>

          <ul
            className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-faint xl:justify-start"
            style={{ animation: "fx-row-in 900ms 480ms ease both" }}
          >
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-muted" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="fx-float mx-auto w-full max-w-[560px] xl:max-w-none"
          style={{ animationDelay: "-2s" }}
        >
          <div style={{ animation: "fx-row-in 1000ms 300ms cubic-bezier(.2,.7,.2,1) both" }}>
            <AIConsole />
          </div>
          <p className="mt-3 text-center text-[11px] text-faint">Illustration — example data</p>
        </div>
      </div>
    </section>
  );
}
