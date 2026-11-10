import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { TONES, type Screen, type Tone } from "@/lib/screens";

export interface PageHeaderProps {
  screen?: Screen;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ screen, title, description, actions, children }: PageHeaderProps) {
  const displayTitle = screen?.title ?? title ?? "";
  const displaySummary = screen?.summary ?? description ?? "";
  const tone: Tone = screen?.tone ?? "system";
  const Icon = screen?.icon ?? Sparkles;
  const toneLabel = TONES[tone]?.label ?? "Miracle Studio";

  return (
    <div
      data-tone={tone}
      className="relative flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <span aria-hidden="true" className="absolute -bottom-px left-0 h-0.5 w-16 rounded-full bg-tone" />
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-tone/20 bg-tone-soft">
          <Icon className="size-5 text-tone" />
        </div>
        <div>
          <div className="eyebrow mb-1 text-[11px]">
            {toneLabel}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">{displayTitle}</h1>
            {screen?.badge && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand">
                {screen.badge}
              </span>
            )}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{displaySummary}</p>
        </div>
      </div>
      {(actions || children) && <div className="flex shrink-0 gap-2 items-center">{actions ?? children}</div>}
    </div>
  );
}
