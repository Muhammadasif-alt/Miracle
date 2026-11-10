import { Ban, Check, Clock, FileSearch, Hand, Power, ShieldCheck, UserCheck } from "lucide-react";
import SectionTitle from "./SectionTitle";

const DECISIONS = [
  { label: "ACT", note: "Follow-up to an interested lead", icon: Check, cls: "border-[#6ad8ff]/30 bg-[#6ad8ff]/10 text-[#a8e8ff]" },
  { label: "ASK", note: "Message mentions pricing", icon: Hand, cls: "border-amber-300/30 bg-amber-300/10 text-amber-100" },
  { label: "WAIT", note: "Contacted 2 days ago", icon: Clock, cls: "border-sky-400/30 bg-sky-400/10 text-sky-200" },
  { label: "BLOCK", note: "Asked to unsubscribe", icon: Ban, cls: "border-rose-400/30 bg-rose-400/10 text-rose-200" },
];

const POINTS = [
  { icon: UserCheck, title: "You approve what matters", body: "Pricing, proposals and anything sensitive always come to a person first." },
  { icon: FileSearch, title: "Every action explained", body: "Each message records the evidence, the rules checked and how sure the AI was." },
  { icon: Power, title: "One kill switch", body: "Stop all outreach instantly — it takes effect before the next send." },
];

/** "AI proposes, policy decides": proposals flow into the engine and come out with a verdict. */
export default function Control() {
  return (
    <section id="safety" aria-labelledby="safety-title" className="relative isolate scroll-mt-24 border-t border-white/[0.06] py-28">
      <div
        aria-hidden="true"
        className="fx-aurora top-1/4 right-[-10%] -z-10 h-[380px] w-[520px] bg-[#2bb8e8]"
        style={{ opacity: 0.14 }}
      />
      <div className="mx-auto grid max-w-page items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionTitle
            id="safety-title"
            align="left"
            eyebrow="You stay in control"
            title={
              <>
                AI proposes. <span className="text-gradient">Rules decide.</span>
              </>
            }
            lede="The AI never sends on a whim. Every proposed action goes through a fixed rule engine that answers act, ask, wait or block."
          />
          <ul className="mt-10 space-y-5">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="glass grid size-10 shrink-0 place-items-center rounded-xl">
                  <Icon className="size-4.5 text-white" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* decision engine */}
        <div className="fx-beam">
          <div className="fx-beam-inner relative overflow-hidden p-5 sm:p-7">
            <div className="mx-auto flex w-fit items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3">
              <span className="relative grid size-8 place-items-center">
                <span className="fx-pulse-ring" />
                <ShieldCheck className="size-5 text-white" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">Policy engine</p>
                <p className="text-[11px] text-faint">Same input, same answer — every time</p>
              </div>
            </div>
            <div aria-hidden="true" className="mx-auto h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
            <ul className="space-y-2.5">
              {DECISIONS.map(({ label, note, icon: Icon, cls }, i) => (
                <li
                  key={label}
                  className="fx-flow flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  style={{ ["--flow-delay" as string]: `${i * 0.5}s` }}
                >
                  <span className="flex-1 truncate text-[13px] text-muted">{note}</span>
                  <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[11px] font-semibold ${cls}`}>
                    <Icon className="size-3" aria-hidden="true" />
                    {label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-center text-[11px] text-faint">Illustration — example decisions</p>
          </div>
        </div>
      </div>
    </section>
  );
}
