import type { ReactNode } from "react";
import { CalendarCheck, FolderHeart, Inbox, LineChart, PenLine, Radar } from "lucide-react";
import SectionTitle from "./SectionTitle";
import SpotlightGroup from "./fx/SpotlightGroup";
import PitchTyper from "./PitchTyper";

function Tile({
  icon: Icon,
  title,
  body,
  visual,
  className = "",
}: {
  icon: typeof Radar;
  title: string;
  body: string;
  visual: ReactNode;
  className?: string;
}) {
  return (
    <article className={`glass fx-spot group flex flex-col overflow-hidden rounded-3xl ${className}`}>
      <div className="relative min-h-[180px] flex-1 border-b border-white/[0.06]">{visual}</div>
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <Icon className="size-4 text-white/80" aria-hidden="true" />
          <h3 className="text-base font-semibold text-fg">{title}</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </article>
  );
}

/** Radar sweep with leads blipping in. */
function RadarVisual() {
  const blips = [
    { x: "28%", y: "34%", d: "0s" },
    { x: "64%", y: "26%", d: "0.9s" },
    { x: "72%", y: "62%", d: "1.7s" },
    { x: "38%", y: "70%", d: "2.4s" },
    { x: "50%", y: "46%", d: "3s" },
  ];
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative size-48 rounded-full border border-white/10 sm:size-56">
        <div className="absolute inset-6 rounded-full border border-white/[0.07]" />
        <div className="absolute inset-14 rounded-full border border-white/[0.07]" />
        <div className="fx-sweep absolute inset-0 rounded-full" />
        <div className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        {blips.map((b) => (
          <span
            key={b.x + b.y}
            className="fx-blip absolute size-2.5 rounded-full bg-[#9d8cff] shadow-[0_0_12px_#9d8cff]"
            style={{ left: b.x, top: b.y, ["--blip-delay" as string]: b.d }}
          />
        ))}
      </div>
    </div>
  );
}

/** Replies scrolling with their detected intent. */
function InboxVisual() {
  const rows = [
    ["Interested", "Sounds good, can we talk Thursday?", "bg-[#6ad8ff]/15 text-[#a8e8ff]"],
    ["Question", "What would a logo refresh cost?", "bg-sky-400/15 text-sky-200"],
    ["Not now", "Maybe after the holidays.", "bg-amber-300/15 text-amber-100"],
    ["Interested", "Send me some website examples", "bg-[#6ad8ff]/15 text-[#a8e8ff]"],
    ["Unsubscribe", "Please remove me.", "bg-rose-400/15 text-rose-200"],
  ] as const;
  const list = [...rows, ...rows];
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
      <ul className="fx-slide-up space-y-2 p-4">
        {list.map(([tag, text], i) => (
          <li key={i} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${rows[i % rows.length][2]}`}>{tag}</span>
            <span className="truncate text-[12px] text-muted">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Portfolio pieces matched to a lead. */
function PortfolioVisual() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative h-32 w-52">
        {[
          "from-[#b49cff]/50 to-[#ff9ad5]/20 -rotate-12 -translate-x-10",
          "from-[#6ad8ff]/50 to-[#8b7bff]/20 rotate-6 translate-x-10",
          "from-white/40 to-white/5 rotate-0",
        ].map((c, i) => (
          <div
            key={i}
            className={`fx-float absolute inset-0 rounded-2xl border border-white/15 bg-gradient-to-br shadow-2xl ${c}`}
            style={{ animationDelay: `${-i * 1.6}s` }}
          />
        ))}
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-[#0b0b0b] px-3 py-1 text-[11px] whitespace-nowrap text-fg">
          Bakery rebrand · 94% match
        </span>
      </div>
    </div>
  );
}

/** A calendar week with one slot lighting up. */
function CalendarVisual() {
  return (
    <div className="absolute inset-0 grid place-items-center p-5">
      <div className="grid w-full max-w-[260px] grid-cols-5 gap-1.5">
        {["M", "T", "W", "T", "F"].map((d, i) => (
          <span key={i} className="text-center text-[10px] text-faint">
            {d}
          </span>
        ))}
        {Array.from({ length: 15 }, (_, i) => (
          <span
            key={i}
            className={`h-6 rounded-md border ${
              i === 8 ? "fx-node-glow border-white/40 bg-white/15" : "border-white/[0.07] bg-white/[0.03]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** A trend line drawing itself (no numbers — illustration only). */
function LearningVisual() {
  return (
    <div className="absolute inset-0 p-5">
      <svg viewBox="0 0 300 140" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="bento-line" x1="0" x2="1">
            <stop offset="0" stopColor="#9d8cff" />
            <stop offset="0.5" stopColor="#ffffff" />
            <stop offset="1" stopColor="#6ad8ff" />
          </linearGradient>
        </defs>
        {[35, 70, 105].map((y) => (
          <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
        ))}
        <path
          className="fx-draw"
          d="M0 120 C 40 115, 60 100, 90 102 S 140 80, 170 70 S 220 52, 250 38 S 285 22, 300 16"
          fill="none"
          stroke="url(#bento-line)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function Bento() {
  return (
    <section id="features" aria-labelledby="features-title" className="relative isolate scroll-mt-24 border-t border-white/[0.06] py-28">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <SectionTitle
          id="features-title"
          eyebrow="AI features"
          title={
            <>
              A full sales team of AI agents, <span className="text-gradient">working for the studio</span>
            </>
          }
          lede="Each agent does one job well and shares the same memory, so nothing gets said twice and every message is based on real evidence."
        />

        <SpotlightGroup className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Tile
            icon={Radar}
            title="Lead Hunter"
            body="Maps every business in a city and niche, merges duplicates and keeps the source of every fact."
            visual={<RadarVisual />}
            className="lg:row-span-2"
          />
          <Tile
            icon={PenLine}
            title="AI pitch writer"
            body="Writes a one-line hook from what it actually found — never invented praise."
            visual={<PitchTyper />}
            className="lg:col-span-2"
          />
          <Tile
            icon={FolderHeart}
            title="Portfolio match"
            body="Picks the closest piece from our past work to show each lead."
            visual={<PortfolioVisual />}
          />
          <Tile icon={Inbox} title="Smart inbox" body="Every reply sorted by intent, with the next step suggested." visual={<InboxVisual />} />
          <Tile
            icon={CalendarCheck}
            title="Meeting booking"
            body="Interested leads pick a slot; the call lands on Google Calendar with full context."
            visual={<CalendarVisual />}
          />
          <Tile
            icon={LineChart}
            title="Learns every campaign"
            body="Replies and outcomes feed back into targeting, timing and wording."
            visual={<LearningVisual />}
            className="lg:col-span-2"
          />
        </SpotlightGroup>
        <p className="mt-4 text-center text-[11px] text-faint">Illustrations — example data</p>
      </div>
    </section>
  );
}
