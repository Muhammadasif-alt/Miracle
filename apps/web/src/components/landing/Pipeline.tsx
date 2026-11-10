import { CalendarCheck, Lightbulb, MapPin, PenLine, ScanSearch } from "lucide-react";
import SectionTitle from "./SectionTitle";

const STEPS = [
  { icon: MapPin, title: "Discover", body: "Every business in a city and niche, mapped from Google Maps and LinkedIn." },
  { icon: ScanSearch, title: "Research", body: "Website, socials and reviews read and saved as evidence — facts kept apart from guesses." },
  { icon: Lightbulb, title: "Spot the gap", body: "AI finds where they look weak: visuals, video, website speed, mobile, booking." },
  { icon: PenLine, title: "Pitch", body: "A short, personal hook built only from what it found — you approve before it goes." },
  { icon: CalendarCheck, title: "Book the call", body: "Replies are sorted, follow-ups timed, and discovery calls land on your calendar." },
];

/** Five-step flow with a light pulse travelling along the connector. */
export default function Pipeline() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="relative isolate scroll-mt-24 py-28">
      <div
        aria-hidden="true"
        className="fx-aurora top-1/3 left-1/2 -z-10 h-[360px] w-[720px] max-w-[140vw] -translate-x-1/2 bg-[#5b4bff]"
        style={{ opacity: 0.18 }}
      />
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <SectionTitle
          id="how-title"
          eyebrow="How it works"
          title={
            <>
              From an empty map to a <span className="text-gradient">booked discovery call</span>
            </>
          }
          lede="One AI pipeline does the slow part of finding clients, so the studio spends its time on design and development."
        />

        <div className="relative mt-16">
          {/* connector: horizontal on desktop, vertical on mobile */}
          <div aria-hidden="true" className="fx-line absolute top-9 right-[10%] left-[10%] hidden h-px overflow-hidden lg:block">
            <span className="fx-travel" />
          </div>
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-9 w-px overflow-hidden bg-gradient-to-b from-transparent via-white/15 to-transparent lg:hidden"
          >
            <span className="fx-travel-y" />
          </div>

          <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-5">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-5 lg:flex-col lg:items-center lg:text-center">
                <span
                  className="fx-node-glow glass relative grid size-[72px] shrink-0 place-items-center rounded-2xl"
                  style={{ ["--node-delay" as string]: `${i * 0.75}s` }}
                >
                  <Icon className="size-7 text-white" aria-hidden="true" />
                  <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border border-white/15 bg-[#0b0b0b] font-mono text-[10px] text-muted">
                    {i + 1}
                  </span>
                </span>
                <div className="pt-1 lg:pt-4">
                  <h3 className="text-lg font-semibold text-fg">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted lg:mx-auto lg:max-w-[15rem]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
