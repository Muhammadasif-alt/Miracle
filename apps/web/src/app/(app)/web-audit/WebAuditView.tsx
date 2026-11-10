"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  Gauge,
  Globe,
  Loader2,
  MapPin,
  ScanSearch,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { AuditResult, Check } from "@/lib/web-audit";

type Lead = { id: string; name: string; website: string; city: string; niche: string };

const VERDICT: Record<AuditResult["verdict"], { label: string; cls: string; line: string }> = {
  NO_WEBSITE: { label: "No website", cls: "border-rose-400/30 bg-rose-400/10 text-rose-200", line: "Best opportunity: they need a website." },
  UNREACHABLE: { label: "Website down", cls: "border-rose-400/30 bg-rose-400/10 text-rose-200", line: "The site doesn't open — a rebuild is the pitch." },
  WEAK: { label: "Weak website", cls: "border-amber-300/30 bg-amber-300/10 text-amber-100", line: "Plenty to fix — a strong lead for development work." },
  AVERAGE: { label: "Average website", cls: "border-sky-400/30 bg-sky-400/10 text-sky-200", line: "Works, but there are clear upgrades to offer." },
  GOOD: { label: "Good website", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200", line: "Solid site — pitch SEO or ranking instead." },
};

const PRIORITY = {
  High: "bg-rose-400/15 text-rose-200",
  Medium: "bg-amber-300/15 text-amber-100",
  Low: "bg-white/10 text-muted",
};

function StatusIcon({ s }: { s: Check["status"] }) {
  if (s === "pass") return <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-label="Pass" />;
  if (s === "warn") return <AlertTriangle className="size-4 shrink-0 text-amber-300" aria-label="Needs work" />;
  if (s === "fail") return <XCircle className="size-4 shrink-0 text-rose-400" aria-label="Fail" />;
  return <CircleSlash className="size-4 shrink-0 text-faint" aria-label="Not checked" />;
}

function ScoreRing({ score }: { score: number | null }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = score ?? 0;
  return (
    <div className="relative grid size-28 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="audit-ring" x1="0" x2="1">
            <stop offset="0" stopColor="#9d8cff" />
            <stop offset="1" stopColor="#6ad8ff" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#audit-ring)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-semibold">{score ?? "—"}</p>
        <p className="text-[10px] tracking-wider text-faint uppercase">Health</p>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-fg">{value ?? "—"}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${value == null ? "" : value >= 80 ? "bg-emerald-400" : value >= 50 ? "bg-amber-300" : "bg-rose-400"}`}
          style={{ width: `${value ?? 0}%`, transition: "width 1s cubic-bezier(.2,.7,.2,1)" }}
        />
      </div>
    </div>
  );
}

function NotChecked({ reason }: { reason?: string }) {
  return <p className="rounded-xl border border-dashed border-white/10 px-3 py-2.5 text-xs text-faint">Not checked — {reason ?? "unavailable"}.</p>;
}

export function WebAuditView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"ALL" | "NO_SITE">("ALL");
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ url: "", name: "", city: "", niche: "" });
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  useEffect(() => {
    fetch("/api/leads?tab=ACTIVE")
      .then((r) => r.json())
      .then((d: { leads?: Record<string, unknown>[] }) => {
        const list = (d.leads ?? []).map((l) => ({
          id: String(l.id),
          name: String(l.companyName ?? l.businessName ?? "Unknown"),
          website: String(l.website ?? ""),
          city: String(l.city ?? ""),
          niche: String(l.industry ?? l.niche ?? ""),
        }));
        setLeads(list);
      })
      .catch(() => undefined);
  }, []);

  const shown = useMemo(() => {
    const term = q.toLowerCase().trim();
    return leads
      .filter((l) => (filter === "NO_SITE" ? !l.website : true))
      .filter((l) => !term || `${l.name} ${l.website} ${l.city} ${l.niche}`.toLowerCase().includes(term));
  }, [leads, filter, q]);
  const noSite = leads.filter((l) => !l.website).length;

  async function audit(input: typeof form, key: string) {
    setRunning(key);
    setError(null);
    try {
      const res = await fetch("/api/dev/web-audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as { ok: boolean; result?: AuditResult; error?: string };
      if (!data.ok || !data.result) throw new Error(data.error ?? "Audit failed.");
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed.");
    }
    setRunning(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void audit(form, "form");
  }

  const v = result ? VERDICT[result.verdict] : null;
  const checks = result?.checks ?? [];
  const passed = checks.filter((c) => c.status === "pass").length;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#6d5dfc]/15 via-transparent to-[#2bb8e8]/10 p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#6ad8ff] via-[#8b7bff] to-[#7dffc4] p-[1.5px]">
              <span className="grid size-full place-items-center rounded-[14px] bg-[#0a0a11]">
                <ScanSearch className="size-5 text-white" aria-hidden="true" />
              </span>
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#a99dff] uppercase">Developer tools</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Web Audit</h1>
              <p className="mt-1 max-w-xl text-sm text-muted">
                Check any lead’s website and Google visibility, then see exactly which development services to pitch.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3 md:grid-cols-[2fr_1.4fr_1fr_1fr_auto]">
          <label className="sr-only" htmlFor="wa-url">Website</label>
          <div className="relative">
            <Globe className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
            <input
              id="wa-url"
              className="input h-11 pl-9"
              placeholder="website.com (leave empty if none)"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <input className="input h-11" placeholder="Business name" aria-label="Business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input h-11" placeholder="City" aria-label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="input h-11" placeholder="Niche (e.g. dentist)" aria-label="Niche" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
          <button type="submit" disabled={running !== null || (!form.url && !form.name)} className="btn btn-primary h-11">
            {running === "form" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Run audit
          </button>
        </form>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* leads list */}
        <section className="card flex max-h-[760px] flex-col overflow-hidden p-0" aria-label="Leads">
          <div className="border-b border-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Your leads</h2>
              <span className="text-xs text-faint">{leads.length} active</span>
            </div>
            <div className="relative mt-3">
              <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" aria-hidden="true" />
              <input className="input h-9 pl-8 text-xs" placeholder="Search leads" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              {(
                [
                  ["ALL", `All (${leads.length})`],
                  ["NO_SITE", `No website (${noSite})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={`rounded-full border px-3 py-1 transition-colors ${
                    filter === k ? "border-[#9d8cff]/40 bg-[#9d8cff]/15 text-white" : "border-white/10 text-muted hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ul className="flex-1 divide-y divide-white/[0.05] overflow-y-auto">
            {shown.length === 0 ? <li className="p-6 text-center text-xs text-faint">No leads here yet.</li> : null}
            {shown.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{l.name}</p>
                  <p className="truncate text-[11px] text-faint">
                    {l.website ? l.website.replace(/^https?:\/\//, "") : <span className="text-rose-300">No website</span>}
                    {l.city ? ` · ${l.city}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={running !== null}
                  onClick={() => {
                    const input = { url: l.website, name: l.name, city: l.city, niche: l.niche };
                    setForm(input);
                    void audit(input, l.id);
                  }}
                  className="btn btn-secondary h-8 shrink-0 px-3 text-xs"
                >
                  {running === l.id ? <Loader2 className="size-3.5 animate-spin" /> : "Audit"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* result */}
        <section aria-live="polite" className="min-w-0 space-y-6">
          {running ? (
            <div className="card grid min-h-[320px] place-items-center p-10 text-center">
              <div>
                <span className="relative mx-auto grid size-14 place-items-center">
                  <span className="fx-pulse-ring" />
                  <ScanSearch className="size-6 text-[#c7bfff]" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-medium">Auditing…</p>
                <p className="mt-1 text-xs text-faint">Opening the site, checking SEO and asking Google. Speed tests can take up to a minute.</p>
              </div>
            </div>
          ) : !result ? (
            <div className="card grid min-h-[320px] place-items-center p-10 text-center">
              <div>
                <ScanSearch className="mx-auto size-8 text-faint" aria-hidden="true" />
                <p className="mt-4 text-sm font-medium">Pick a lead or enter a website</p>
                <p className="mt-1 max-w-sm text-xs text-faint">
                  You’ll see if the site works, how fast it is, whether it’s ready for Google, and which services to offer.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* summary */}
              <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                <ScoreRing score={result.score} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-semibold">{result.input.name ?? result.finalUrl ?? result.input.url}</h2>
                    {v ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${v.cls}`}>{v.label}</span> : null}
                  </div>
                  {result.finalUrl ? (
                    <a href={result.finalUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-[#a99dff] hover:underline">
                      {result.finalUrl.replace(/^https?:\/\//, "")}
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  ) : null}
                  <p className="mt-2 text-sm text-muted">{v?.line}</p>
                  {checks.length ? (
                    <p className="mt-1 text-xs text-faint">
                      {passed} of {checks.length} checks passed
                      {result.responseMs != null ? ` · first response ${(result.responseMs / 1000).toFixed(1)} s` : ""}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* opportunities */}
              <div className="card p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-[#c7bfff]" aria-hidden="true" />
                  What Asif can offer
                </h3>
                {result.opportunities.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No clear website gaps found. Pitch ongoing SEO, content or a new feature instead.</p>
                ) : (
                  <ul className="mt-4 grid gap-3 md:grid-cols-2">
                    {result.opportunities.map((o) => (
                      <li key={o.service} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold">{o.service}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY[o.priority]}`}>{o.priority}</span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted">{o.why}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* google visibility */}
                <div className="card space-y-4 p-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="size-4 text-[#6ad8ff]" aria-hidden="true" />
                    Google visibility
                  </h3>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs text-faint">
                      <MapPin className="size-3.5" aria-hidden="true" /> Google Maps listing
                    </p>
                    {!result.listing.available ? (
                      <NotChecked reason={result.listing.reason} />
                    ) : result.listing.found ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
                        <p className="font-medium">{result.listing.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                          <Star className="size-3 fill-amber-300 text-amber-300" aria-hidden="true" />
                          {result.listing.rating ?? "—"} · {result.listing.reviews ?? 0} reviews
                          {result.listing.websiteMatches === false ? <span className="ml-1 text-amber-200">· listing links a different site</span> : null}
                        </p>
                        {result.listing.mapsUrl ? (
                          <a href={result.listing.mapsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-[#a99dff] hover:underline">
                            Open in Maps <ExternalLink className="size-3" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-xs text-rose-200">Not found on Google Maps.</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs text-faint">
                      <Search className="size-3.5" aria-hidden="true" /> Search ranking
                    </p>
                    {!result.ranking.available ? (
                      <NotChecked reason={result.ranking.reason} />
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm">
                        <p>
                          {result.ranking.position ? (
                            <>
                              Ranks <span className="font-semibold">#{result.ranking.position}</span>
                            </>
                          ) : (
                            <span className="text-rose-200">Not in the top 10</span>
                          )}{" "}
                          for “{result.ranking.query}”
                        </p>
                        {result.ranking.brandFound != null ? (
                          <p className="mt-0.5 text-xs text-muted">
                            {result.ranking.brandFound ? "Shows up when people search the business name." : "Doesn’t show up even for its own name."}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* speed */}
                <div className="card space-y-4 p-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Gauge className="size-4 text-[#9d8cff]" aria-hidden="true" />
                    Google PageSpeed (mobile)
                  </h3>
                  {!result.pageSpeed.available ? (
                    <NotChecked reason={result.pageSpeed.reason} />
                  ) : (
                    <div className="space-y-3">
                      <Bar label="Performance" value={result.pageSpeed.performance} />
                      <Bar label="SEO" value={result.pageSpeed.seo} />
                      <Bar label="Accessibility" value={result.pageSpeed.accessibility} />
                      <Bar label="Best practices" value={result.pageSpeed.bestPractices} />
                      {result.pageSpeed.lcpSeconds ? (
                        <p className="text-xs text-faint">Main content appears after {result.pageSpeed.lcpSeconds} s on a phone.</p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* checklist */}
              {checks.length ? (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold">Website checklist</h3>
                  <ul className="mt-4 grid gap-x-6 gap-y-1 md:grid-cols-2">
                    {checks.map((c) => (
                      <li key={c.id} className="flex items-start gap-3 border-b border-white/[0.05] py-2.5">
                        <StatusIcon s={c.status} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium">{c.label}</p>
                          <p className="truncate text-xs text-faint" title={c.detail}>{c.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
