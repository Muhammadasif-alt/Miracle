import { CodeXml, Gauge, ImageOff, LayoutTemplate, Palette, Smartphone, Type, Video, CalendarX } from "lucide-react";
import SectionTitle from "./SectionTitle";
import SpotlightGroup from "./fx/SpotlightGroup";

const DESIGN = [
  { icon: Video, label: "No reels in 90 days", level: "High" },
  { icon: ImageOff, label: "Low-res product photos", level: "High" },
  { icon: Type, label: "Logo & fonts inconsistent", level: "Medium" },
];
const DEV = [
  { icon: Gauge, label: "Site loads in 6+ seconds", level: "High" },
  { icon: Smartphone, label: "Breaks on mobile", level: "High" },
  { icon: CalendarX, label: "No online booking form", level: "Medium" },
];

function GapList({
  title,
  who,
  icon: Icon,
  items,
  accent,
  offset,
}: {
  title: string;
  who: string;
  icon: typeof Palette;
  items: typeof DESIGN;
  accent: string;
  offset: number;
}) {
  return (
    <div className="glass fx-spot rounded-3xl p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${accent} p-[1.5px]`}>
          <span className="grid size-full place-items-center rounded-[10px] bg-[#0b0b0b]">
            <Icon className="size-5 text-white" aria-hidden="true" />
          </span>
        </span>
        <div>
          <h3 className="text-base font-semibold text-fg">{title}</h3>
          <p className="text-xs text-faint">{who}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {items.map(({ icon: ItemIcon, label, level }, i) => (
          <li
            key={label}
            className="fx-tag-in flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
            style={{ ["--tag-delay" as string]: `${(offset + i) * 0.35}s` }}
          >
            <ItemIcon className="size-4 shrink-0 text-white/75" aria-hidden="true" />
            <span className="flex-1 text-[13px] text-fg">{label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                level === "High" ? "bg-rose-400/15 text-rose-200" : "bg-amber-300/15 text-amber-100"
              }`}
            >
              {level}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One business, scanned twice: what the designer can fix and what the developer can fix. */
export default function GapScan() {
  return (
    <section id="product" aria-labelledby="gap-title" className="relative isolate scroll-mt-24 border-t border-white/[0.06] py-28">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <SectionTitle
          id="gap-title"
          eyebrow="Gap scan"
          title={
            <>
              Every lead, scanned for <span className="text-gradient">design and development</span> work
            </>
          }
          lede="Miracle reads each business the way our team would — and shows exactly what Zohaib can redesign and what Asif can rebuild. That gap becomes the reason to reach out."
        />

        <SpotlightGroup className="mt-16 grid items-center gap-6 lg:grid-cols-[1fr_minmax(0,380px)_1fr]">
          <div className="lg:order-1">
            <GapList
              title="Design opportunities"
              who="Zohaib · Designer"
              icon={Palette}
              items={DESIGN}
              accent="from-[#b49cff] via-[#ff9ad5] to-[#ffd29a]"
              offset={0}
            />
          </div>

          {/* scanned business */}
          <div className="relative order-first mx-auto w-full max-w-[380px] lg:order-2">
            <div className="fx-beam">
              <div className="fx-beam-inner relative overflow-hidden p-5">
                <div className="fx-scan" aria-hidden="true" />
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-white/25 to-white/5 text-sm font-semibold">
                    GC
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-fg">Golden Crumb Bakery</p>
                    <p className="text-xs text-faint">Austin, TX · Bakery</p>
                  </div>
                </div>
                {/* mock website being scanned */}
                <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
                    <span className="size-1.5 rounded-full bg-white/25" />
                    <span className="size-1.5 rounded-full bg-white/25" />
                    <span className="size-1.5 rounded-full bg-white/25" />
                    <span className="ml-2 h-2 w-28 rounded-full bg-white/10" />
                  </div>
                  <div className="space-y-2.5 p-3">
                    <div className="relative h-20 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02]">
                      <LayoutTemplate className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-white/20" aria-hidden="true" />
                    </div>
                    <div className="h-2 w-3/4 rounded-full bg-white/10" />
                    <div className="h-2 w-1/2 rounded-full bg-white/10" />
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="h-10 rounded-lg bg-white/[0.06]" />
                      <div className="h-10 rounded-lg bg-white/[0.06]" />
                      <div className="h-10 rounded-lg bg-white/[0.06]" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-faint">Opportunity fit</span>
                  <span className="text-shine font-semibold">Strong for both</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-faint">Illustration — example business</p>
          </div>

          <div className="lg:order-3">
            <GapList
              title="Development opportunities"
              who="Asif · Developer"
              icon={CodeXml}
              items={DEV}
              accent="from-[#6ad8ff] via-[#8b7bff] to-[#7dffc4]"
              offset={3}
            />
          </div>
        </SpotlightGroup>
      </div>
    </section>
  );
}
