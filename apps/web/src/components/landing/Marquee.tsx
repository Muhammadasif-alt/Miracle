import {
  Brain,
  CalendarCheck,
  Globe,
  Inbox,
  Users,
  MapPin,
  PenLine,
  Scale,
  ShieldCheck,
  Sheet,
  Sparkles,
  Video,
} from "lucide-react";

const ITEMS = [
  { icon: MapPin, label: "Google Maps discovery" },
  { icon: Users, label: "LinkedIn prospecting" },
  { icon: Globe, label: "Website & social research" },
  { icon: Sparkles, label: "Visual gap scoring" },
  { icon: PenLine, label: "Grounded personalization" },
  { icon: Scale, label: "Deterministic policy engine" },
  { icon: Inbox, label: "Unified inbox" },
  { icon: CalendarCheck, label: "Meeting booking" },
  { icon: Sheet, label: "Google Sheets sync" },
  { icon: Video, label: "YouTube scraping" },
  { icon: Brain, label: "Continuous learning" },
  { icon: ShieldCheck, label: "Suppression & kill switch" },
];

/** Endless ribbon of capabilities under the hero. */
export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <section aria-label="Capabilities" className="relative border-y border-white/[0.06] bg-white/[0.015] py-6">
      <div className="fx-marquee-mask overflow-hidden">
        <ul className="fx-marquee gap-3 pr-3">
          {row.map(({ icon: Icon, label }, i) => (
            <li
              key={`${label}-${i}`}
              aria-hidden={i >= ITEMS.length}
              className="glass flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] whitespace-nowrap text-muted"
            >
              <Icon className="size-4 text-white/80" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
