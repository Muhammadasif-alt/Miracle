import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "../brand/Logo";

export default function CTA() {
  return (
    <section aria-labelledby="cta-title" className="border-t border-line py-24">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="fx-beam">
        <div className="fx-beam-inner relative isolate overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_100%,black,transparent)]"
          />
          <div
            aria-hidden="true"
            className="fx-orb pointer-events-none absolute -bottom-48 left-1/2 -z-10 h-80 w-80 -translate-x-1/2"
          />
          <LogoMark className="mx-auto h-9 w-auto" />
          <h2
            id="cta-title"
            className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-balance text-fg sm:text-5xl sm:leading-[1.08]"
          >
            Map your market today. <span className="text-gradient">Book meetings on autopilot</span> — with you in control.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted">
            Pick a city and an industry. Lead Hunter does the rest, and every action stays within your rules.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/lead-hunter" className="btn btn-primary btn-lg w-full sm:w-auto">
              Start hunting leads
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/dashboard" className="btn btn-ghost btn-lg w-full sm:w-auto">
              Open the app
            </Link>
        </div>
          </div>
        </div>
      </div>
    </section>
  );
}
