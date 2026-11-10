import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

/** Glass eyebrow + large heading + lede used at the top of every landing section. */
export default function SectionTitle({
  id,
  eyebrow,
  title,
  lede,
  align = "center",
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "center" | "left";
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left"}>
      <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
        <Sparkles className="size-3 text-white/80" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2
        id={id}
        className="mt-5 text-3xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-fg sm:text-5xl"
      >
        {title}
      </h2>
      {lede ? (
        <p className={`mt-5 text-base leading-relaxed text-pretty text-muted sm:text-lg ${center ? "mx-auto max-w-2xl" : ""}`}>
          {lede}
        </p>
      ) : null}
    </div>
  );
}
