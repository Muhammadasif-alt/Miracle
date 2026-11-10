"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Radar,
  ScanSearch,
  Search,
  Star,
} from "lucide-react";
import type { AreaBusiness, AreaHuntResult } from "@/lib/area-hunter";

const NICHES = ["Landscaper", "Roofer", "Plumber", "Dentist", "HVAC", "Electrician", "Restaurant", "Salon", "Gym", "Auto repair", "Real estate", "Contractor"];
type Tri = "ANY" | "YES" | "NO";

function dotColour(b: AreaBusiness): string {
  if (b.onGoogle === false) return "#fb7185"; // not on Google
  if (!b.website) return "#6ad8ff"; // on Google (or unknown), no website
  return "#9d8cff"; // has website
}

/** Businesses plotted around the centre by real bearing and distance. */
function RadarPlot({ result, selected, onSelect }: { result: AreaHuntResult; selected: string | null; onSelect: (id: string) => void }) {
  const R = result.query.radiusKm;
  const { lat: cLat, lon: cLon } = result.center;
  const pts = result.businesses.map((b) => {
    const dx = (b.lon - cLon) * 111.32 * Math.cos((cLat * Math.PI) / 180);
    const dy = (b.lat - cLat) * 110.57;
    return { b, x: 50 + (dx / R) * 46, y: 50 - (dy / R) * 46 };
  });
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label={`${pts.length} businesses within ${R} km`}>
        <defs>
          <radialGradient id="ah-bg">
            <stop offset="0" stopColor="rgba(157,140,255,0.16)" />
            <stop offset="1" stopColor="rgba(157,140,255,0)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#ah-bg)" stroke="var(--color-line)" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="30.7" fill="none" stroke="var(--color-line)" strokeWidth="0.3" strokeDasharray="1 1.5" />
        <circle cx="50" cy="50" r="15.3" fill="none" stroke="var(--color-line)" strokeWidth="0.3" strokeDasharray="1 1.5" />
        <line x1="50" y1="4" x2="50" y2="96" stroke="var(--color-line)" strokeWidth="0.2" />
        <line x1="4" y1="50" x2="96" y2="50" stroke="var(--color-line)" strokeWidth="0.2" />
        {pts.map(({ b, x, y }) => (
          <circle
            key={b.id}
            cx={x}
            cy={y}
            r={selected === b.id ? 2.2 : 1.3}
            fill={dotColour(b)}
            stroke={selected === b.id ? "white" : "none"}
            strokeWidth="0.5"
            className="cursor-pointer"
            onClick={() => onSelect(b.id)}
          >
            <title>{`${b.name} · ${b.distanceKm} km`}</title>
          </circle>
        ))}
        <circle cx="50" cy="50" r="1.4" fill="var(--color-fg)" />
      </svg>
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-faint">{R} km</span>
    </div>
  );
}

function Stat({ label, value, hint, cls }: { label: string; value: number | string; hint?: string; cls?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] tracking-wider text-faint uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${cls ?? ""}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}

function Chips({ label, value, onChange, disabled, options }: { label: string; value: Tri; onChange: (v: Tri) => void; disabled?: boolean; options: [Tri, string][] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] text-faint">{label}</span>
      {options.map(([k, l]) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onChange(k)}
          className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-40 ${
            value === k ? "border-(--accent)/50 bg-(--accent)/15 text-fg" : "border-line text-muted hover:text-fg"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function AreaHunterView() {
  const [form, setForm] = useState({ area: "", country: "United States", niche: "Landscaper", radiusKm: 5 });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AreaHuntResult | null>(null);
  const [onGoogle, setOnGoogle] = useState<Tri>("ANY");
  const [hasSite, setHasSite] = useState<Tri>("ANY");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, "saving" | "done">>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setRunning(true);
    setError(null);
    setSelected(null);
    try {
      const res = await fetch("/api/dev/area-hunt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const data = (await res.json()) as { ok: boolean; result?: AreaHuntResult; error?: string };
      if (!data.ok || !data.result) throw new Error(data.error ?? "Search failed.");
      setResult(data.result);
      setOnGoogle("ANY");
      setHasSite("ANY");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    }
    setRunning(false);
  }

  const shown = useMemo(() => {
    if (!result) return [];
    const term = q.toLowerCase().trim();
    return result.businesses.filter(
      (b) =>
        (onGoogle === "ANY" || (onGoogle === "YES" ? b.onGoogle === true : b.onGoogle === false)) &&
        (hasSite === "ANY" || (hasSite === "YES" ? !!b.website : !b.website)) &&
        (!term || `${b.name} ${b.address ?? ""}`.toLowerCase().includes(term)),
    );
  }, [result, onGoogle, hasSite, q]);

  async function saveLead(b: AreaBusiness) {
    if (!result) return;
    setSaved((s) => ({ ...s, [b.id]: "saving" }));
    const src = (v: string | null, from: string) => (v ? { value: v, source: from } : undefined);
    const from = b.sources.join(" + ");
    const city = result.query.area;
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lead: {
            companyName: b.name,
            businessName: b.name,
            contactEmail: b.email ?? undefined,
            email: b.email ?? undefined,
            website: b.website ?? "",
            phone: b.phone ?? undefined,
            industry: result.query.niche,
            niche: result.query.niche,
            city,
            country: result.query.country,
            source: "Area Hunter",
            auditFindings: [
              b.onGoogle === false ? "Not on Google Maps" : b.onGoogle ? "Has a Google listing" : null,
              b.website ? null : "No website",
            ]
              .filter(Boolean)
              .join(" · "),
            recommendedService: !b.website ? "New website" : b.onGoogle === false ? "Google Business Profile + local SEO" : "Website & SEO upgrade",
            contactChannels: {
              email: src(b.email, from),
              phone: src(b.phone, from),
              facebook: src(b.facebook, from),
              instagram: src(b.instagram, from),
              linkedin: src(b.linkedin, from),
              checkedAt: new Date().toISOString(),
            },
          },
        }),
      });
      setSaved((s) => ({ ...s, [b.id]: "done" }));
    } catch {
      setSaved((s) => {
        const { [b.id]: _drop, ...rest } = s;
        return rest;
      });
    }
  }

  const c = result?.counts;
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#6d5dfc]/15 via-transparent to-[#2bb8e8]/10 p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#6ad8ff] via-[#8b7bff] to-[#7dffc4] p-[1.5px]">
            <span className="grid size-full place-items-center rounded-[14px] bg-canvas">
              <Radar className="size-5 text-fg" aria-hidden="true" />
            </span>
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-(--accent-text) uppercase">Developer tools</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Area Hunter</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Pick an area and a radius. See every business of that kind — which ones are on Google and which have a website — and save the best
              ones as leads.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3 lg:grid-cols-[1.6fr_1fr_1.2fr_1.2fr_auto] lg:items-end">
          <label className="block">
            <span className="text-[11px] text-faint">City, area or ZIP</span>
            <div className="relative mt-1">
              <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
              <input
                className="input h-11 pl-9"
                placeholder="e.g. Austin, TX  ·  Brooklyn, NY  ·  90210"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[11px] text-faint">Country</span>
            <input className="input mt-1 h-11" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-[11px] text-faint">Business type</span>
            <input className="input mt-1 h-11" list="ah-niches" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
            <datalist id="ah-niches">
              {NICHES.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="flex justify-between text-[11px] text-faint">
              <span>Radius</span>
              <span className="font-medium text-fg">{form.radiusKm} km</span>
            </span>
            <input
              type="range"
              min={1}
              max={50}
              value={form.radiusKm}
              onChange={(e) => setForm({ ...form, radiusKm: Number(e.target.value) })}
              className="mt-3 h-2 w-full cursor-pointer accent-[#8b7bff]"
              aria-label="Radius in kilometres"
            />
          </label>
          <button type="submit" disabled={running || !form.area.trim() || !form.niche.trim()} className="btn btn-primary h-11">
            {running ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Hunt area
          </button>
        </form>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      ) : null}

      {running ? (
        <div className="card grid min-h-[260px] place-items-center p-10 text-center">
          <div>
            <span className="relative mx-auto grid size-14 place-items-center">
              <span className="fx-pulse-ring" />
              <Radar className="size-6 text-(--accent-text)" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-medium">Scanning the area…</p>
            <p className="mt-1 text-xs text-faint">Checking OpenStreetMap and Google for every {form.niche.toLowerCase()} within {form.radiusKm} km — this can take up to a minute.</p>
          </div>
        </div>
      ) : null}

      {result && !running ? (
        <>
          <p className="text-xs text-faint">
            <MapPin className="mr-1 inline size-3.5" aria-hidden="true" />
            {result.center.label} · within {result.query.radiusKm} km
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Businesses found" value={c!.total} hint={result.query.niche} />
            <Stat
              label="On Google"
              value={result.googleChecked ? c!.onGoogle : "—"}
              hint={result.googleChecked ? "Have a Google listing" : "Not checked"}
              cls="text-(--accent-text)"
            />
            <Stat
              label="Not on Google"
              value={result.googleChecked ? c!.notOnGoogle : "—"}
              hint={result.googleChecked ? "Found only on OpenStreetMap" : "Not checked"}
              cls="text-rose-400"
            />
            <Stat label="With website" value={c!.withWebsite} cls="text-(--good)" />
            <Stat label="No website" value={c!.withoutWebsite} hint="Best targets for a new site" cls="text-amber-500" />
          </div>

          {result.googleNote || result.osmNote ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-500">
              {[result.googleNote, result.osmNote].filter(Boolean).join(" ")}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <section className="card space-y-5 p-5" aria-label="Map of businesses">
              <RadarPlot result={result} selected={selected} onSelect={setSelected} />
              <ul className="grid grid-cols-1 gap-1.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#9d8cff]" /> Has a website
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#6ad8ff]" /> No website
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#fb7185]" /> Not on Google
                </li>
              </ul>
              <p className="text-[11px] leading-relaxed text-faint">
                “Not on Google” means the business is listed on OpenStreetMap but no matching Google listing was found nearby.
              </p>
            </section>

            <section className="card flex min-w-0 flex-col overflow-hidden p-0" aria-label="Businesses">
              <div className="space-y-3 border-b border-line p-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <Chips
                    label="Google"
                    value={onGoogle}
                    onChange={setOnGoogle}
                    disabled={!result.googleChecked}
                    options={[
                      ["ANY", "All"],
                      ["YES", "On Google"],
                      ["NO", "Not on Google"],
                    ]}
                  />
                  <Chips
                    label="Website"
                    value={hasSite}
                    onChange={setHasSite}
                    options={[
                      ["ANY", "All"],
                      ["YES", "Has website"],
                      ["NO", "No website"],
                    ]}
                  />
                </div>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" aria-hidden="true" />
                  <input className="input h-9 pl-8 text-xs" placeholder="Search by name or street" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <p className="text-[11px] text-faint">
                  Showing {shown.length} of {result.businesses.length}
                </p>
              </div>

              <ul className="max-h-[640px] flex-1 divide-y divide-line overflow-y-auto">
                {shown.length === 0 ? <li className="p-8 text-center text-sm text-faint">No businesses match these filters.</li> : null}
                {shown.map((b) => (
                  <li
                    key={b.id}
                    className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center ${selected === b.id ? "bg-(--accent)/10" : "hover:bg-hover"}`}
                    onMouseEnter={() => setSelected(b.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{b.name}</p>
                        {b.onGoogle === true ? (
                          <span className="rounded-full bg-(--accent)/15 px-2 py-0.5 text-[10px] font-semibold text-(--accent-text)">On Google</span>
                        ) : b.onGoogle === false ? (
                          <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] font-semibold text-rose-400">Not on Google</span>
                        ) : (
                          <span className="rounded-full bg-hover px-2 py-0.5 text-[10px] text-faint">Google not checked</span>
                        )}
                        {!b.website ? <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">No website</span> : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-faint">
                        {b.distanceKm} km{b.address ? ` · ${b.address}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        {b.website ? (
                          <a href={b.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-(--accent-text) hover:underline">
                            <Globe className="size-3" aria-hidden="true" />
                            {b.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").slice(0, 40)}
                          </a>
                        ) : null}
                        {b.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3" aria-hidden="true" />
                            {b.phone}
                          </span>
                        ) : null}
                        {b.rating != null ? (
                          <span className="inline-flex items-center gap-1">
                            <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                            {b.rating} ({b.reviews ?? 0})
                          </span>
                        ) : null}
                        {b.mapsUrl ? (
                          <a href={b.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-fg">
                            Maps <ExternalLink className="size-3" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link
                        href={`/web-audit?${new URLSearchParams({ url: b.website ?? "", name: b.name, city: result.query.area, niche: result.query.niche })}`}
                        className="btn btn-secondary h-8 px-3 text-xs"
                      >
                        <ScanSearch className="size-3.5" />
                        Audit
                      </Link>
                      <button
                        type="button"
                        onClick={() => void saveLead(b)}
                        disabled={!!saved[b.id]}
                        className="btn btn-primary h-8 px-3 text-xs"
                      >
                        {saved[b.id] === "saving" ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : saved[b.id] === "done" ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Plus className="size-3.5" />
                        )}
                        {saved[b.id] === "done" ? "Saved" : "Save lead"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
