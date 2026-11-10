"use client";

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, CircleDashed, ExternalLink, Globe, Loader2, Mail, MapPin, Pause, Phone, Play, Save, Search, Square, UserRound, XCircle } from "lucide-react";
import type { AreaBusiness } from "@/lib/area-hunter";
import type { EnrichedLead, LeadRules } from "@/lib/lead-finder";
import { PlaceInput, type Place } from "./PlacePicker";

type Biz = AreaBusiness & { inLeads: boolean };
type RowState = { status: "waiting" | "checking" | "done" | "error" | "skipped"; lead?: EnrichedLead };

const NICHES = ["Landscaping", "Interior Design", "Architecture", "Construction", "Marketing Agency", "Real Estate", "Dental Clinic", "Restaurant", "Salon", "Gym", "Lawyer", "Accountant", "Plumber", "Electrician"];

const pill = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-(--accent)/50 bg-(--accent)/15 text-(--accent-text)" : "border-line text-muted hover:text-(--color-white)"}`;

const enc = encodeURIComponent;

export function LeadFinderView({ countries }: { countries: { code: string; name: string }[] }) {
  const [form, setForm] = useState({ country: "PK", city: "Lahore", area: "DHA Phase 5", niche: "Landscaping", radiusKm: 5, target: 10 });
  const countryName = countries.find((c) => c.code === form.country)?.name ?? form.country;
  const [cityPlace, setCityPlace] = useState<Place | null>({ name: "Lahore", detail: "Punjab", lat: 31.5657, lon: 74.3142 });
  const [areaPlace, setAreaPlace] = useState<Place | null>(null);
  const [rules, setRules] = useState<LeadRules>({ requireEmail: true, requireOwner: false, requireLinkedin: false });
  const [phase, setPhase] = useState<"idle" | "discovering" | "checking" | "paused" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [list, setList] = useState<Biz[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const control = useRef<{ stop: boolean; pause: boolean }>({ stop: false, pause: false });
  const rowsRef = useRef<Record<string, RowState>>({});

  const setRow = (id: string, r: RowState) => {
    rowsRef.current = { ...rowsRef.current, [id]: r };
    setRows(rowsRef.current);
  };
  const post = (b: object) => fetch("/api/lead-finder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json());
  const qualifiedCount = () => Object.values(rowsRef.current).filter((r) => r.lead?.qualified).length;

  async function check(queue: Biz[]) {
    setPhase("checking");
    control.current = { stop: false, pause: false };
    let i = 0;
    const worker = async () => {
      while (i < queue.length) {
        if (control.current.stop || control.current.pause || qualifiedCount() >= form.target) return;
        const b = queue[i++]!;
        if (rowsRef.current[b.id]?.status === "done") continue;
        setRow(b.id, { status: "checking" });
        try {
          const d = await post({ action: "enrich", business: b, rules });
          setRow(b.id, d.ok ? { status: "done", lead: d.lead } : { status: "error" });
        } catch {
          setRow(b.id, { status: "error" });
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setPhase(control.current.pause ? "paused" : "done");
  }

  const queueFrom = (bs: Biz[]) => bs.filter((b) => !b.inLeads && b.website);

  async function start(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setSavedMsg(null);
    setNotes([]);
    setList([]);
    rowsRef.current = {};
    setRows({});
    setPhase("discovering");
    try {
      const d = await post({ action: "discover", ...form, country: countryName, center: areaPlace ?? (form.area.trim() ? null : cityPlace) });
      if (!d.ok) throw new Error(d.error);
      const bs = (d.businesses as Biz[]).sort((a, b) => Number(!!b.website) - Number(!!a.website) || a.distanceKm - b.distanceKm);
      setList(bs);
      setNotes(d.notes ?? []);
      for (const b of bs) {
        if (b.inLeads) setRow(b.id, { status: "skipped" });
      }
      await check(queueFrom(bs));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
      setPhase("idle");
    }
  }

  async function save() {
    const leads = Object.values(rowsRef.current).flatMap((r) => (r.lead?.qualified ? [r.lead] : []));
    if (!leads.length) return;
    setSaving(true);
    try {
      const d = await post({ action: "save", leads, rules, niche: form.niche, city: [form.area, form.city].filter(Boolean).join(", "), country: countryName });
      if (!d.ok) throw new Error(d.error);
      setSavedMsg(`${d.saved} verified ${d.saved === 1 ? "lead" : "leads"} saved to All Leads. Nothing was emailed — review and pitch them from Pitch Studio.`);
      for (const l of leads) setRow(l.business.id, { status: "skipped", lead: l });
      setList((ls) => ls.map((b) => (leads.some((l) => l.business.id === b.id) ? { ...b, inLeads: true } : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const all = Object.values(rows);
  const done = all.filter((r) => r.lead);
  const m = {
    found: list.length,
    withSite: list.filter((b) => b.website).length,
    checked: done.length,
    verified: done.filter((r) => r.lead!.qualified && r.status === "done").length,
    owners: done.filter((r) => r.lead!.owner).length,
    emails: done.filter((r) => r.lead!.emailStatus === "Published & verified source").length,
    dupes: list.filter((b) => b.inLeads).length,
  };
  const busy = phase === "discovering" || phase === "checking";
  const shortfall = phase === "done" && m.verified < form.target;

  return (
    <div className="mx-auto max-w-page space-y-6">
      <div className="relative z-10 rounded-3xl border border-line bg-gradient-to-br from-[#6d5dfc]/15 via-transparent to-[#2bb8e8]/10 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#6ad8ff] via-[#8b7bff] to-[#7dffc4] p-[1.5px]">
            <span className="grid size-full place-items-center rounded-[14px] bg-(--n-0a0a11)">
              <UserRound className="size-5 text-white" aria-hidden="true" />
            </span>
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-(--accent-text) uppercase">Location · owners · LinkedIn</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Lead Finder</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Businesses inside an area, their owner from the official website, the owner’s LinkedIn when the site links it, and published email / phone. Only verified leads are saved.
            </p>
          </div>
        </div>

        <form onSubmit={start} className="mt-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_1.3fr]">
            <select className="input h-11" aria-label="Country" value={form.country} onChange={(e) => (setForm({ ...form, country: e.target.value, city: "", area: "" }), setCityPlace(null), setAreaPlace(null))}>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <PlaceInput
              type="city"
              label="City"
              placeholder="Start typing a city…"
              country={form.country}
              value={form.city}
              onChange={(v) => (setForm({ ...form, city: v, area: "" }), setCityPlace(null), setAreaPlace(null))}
              onPick={(p) => (setForm({ ...form, city: p.name, area: "" }), setCityPlace(p), setAreaPlace(null))}
            />
            <PlaceInput
              type="area"
              label="Area or neighborhood"
              placeholder={form.city ? `Area in ${form.city} (optional)` : "Pick a city first"}
              country={form.country}
              near={cityPlace}
              value={form.area}
              onChange={(v) => (setForm({ ...form, area: v }), setAreaPlace(null))}
              onPick={(p) => (setForm({ ...form, area: p.name }), setAreaPlace(p))}
            />
            <input className="input h-11" aria-label="Business type" list="lf-niches" placeholder="Business type" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
            <datalist id="lf-niches">{NICHES.map((n) => <option key={n} value={n} />)}</datalist>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              Radius <input type="range" min={1} max={25} value={form.radiusKm} onChange={(e) => setForm({ ...form, radiusKm: Number(e.target.value) })} className="w-28 accent-(--accent)" />
              <span className="w-10 text-(--color-white)">{form.radiusKm} km</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              Verified leads wanted
              <input type="number" min={1} max={50} value={form.target} onChange={(e) => setForm({ ...form, target: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })} className="input h-8 w-16 text-center" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={pill(rules.requireEmail)} onClick={() => setRules({ ...rules, requireEmail: !rules.requireEmail })}>Email required</button>
              <button type="button" className={pill(rules.requireOwner)} onClick={() => setRules({ ...rules, requireOwner: !rules.requireOwner })}>Owner required</button>
              <button type="button" className={pill(rules.requireLinkedin)} onClick={() => setRules({ ...rules, requireLinkedin: !rules.requireLinkedin })}>LinkedIn required</button>
            </div>
            <div className="ml-auto flex gap-2">
              {phase === "checking" ? (
                <>
                  <button type="button" className="btn btn-ghost h-10" onClick={() => (control.current.pause = true)}><Pause className="size-4" />Pause</button>
                  <button type="button" className="btn btn-ghost h-10" onClick={() => (control.current.stop = true)}><Square className="size-4" />Stop</button>
                </>
              ) : phase === "paused" ? (
                <button type="button" className="btn btn-ghost h-10" onClick={() => check(queueFrom(list))}><Play className="size-4" />Resume</button>
              ) : null}
              <button type="submit" disabled={busy || !form.city.trim() || !form.niche.trim()} className="btn btn-primary h-10">
                {phase === "discovering" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Find leads
              </button>
            </div>
          </div>
        </form>
      </div>

      {error ? <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div> : null}
      {savedMsg ? (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-(--good)/30 bg-(--good)/10 px-4 py-3 text-sm text-(--good-text)"><CheckCircle2 className="size-4 shrink-0" />{savedMsg}</div>
      ) : null}

      {phase === "discovering" ? (
        <div className="card grid place-items-center gap-3 p-12 text-sm text-muted"><Loader2 className="size-6 animate-spin text-(--accent-text)" />Finding businesses in {form.area || form.city}…</div>
      ) : null}

      {phase === "done" && !list.length ? (
        <div className="card p-8 text-center text-sm">
          <p className="font-medium">No {form.niche.toLowerCase()} businesses found in {form.area || form.city} within {form.radiusKm} km.</p>
          <p className="mx-auto mt-2 max-w-xl text-muted">
            {notes.some((n) => n.includes("GOOGLE_PLACES_API_KEY"))
              ? "Right now only OpenStreetMap is searched, and it lists very few businesses in many cities. Add GOOGLE_PLACES_API_KEY to apps/web/.env.local to search Google’s business listings too."
              : "Try a bigger radius, a nearby area, or a broader business type."}
          </p>
        </div>
      ) : null}

      {phase === "idle" && !list.length ? (
        <div className="card p-10 text-center text-sm text-muted">Pick a city, an area and a business type. Miracle checks each business’s own website for the owner and published contacts.</div>
      ) : null}

      {list.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              ["Found in area", m.found],
              ["With website", m.withSite],
              ["Checked", m.checked],
              ["Owners found", m.owners],
              ["Verified emails", m.emails],
              ["Already in leads", m.dupes],
              ["Verified leads", `${m.verified} / ${form.target}`],
            ].map(([k, v]) => (
              <div key={k} className="card p-3">
                <p className="text-[11px] text-faint">{k}</p>
                <p className="mt-1 text-lg font-semibold">{v}</p>
              </div>
            ))}
          </div>

          {shortfall ? (
            <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-200">
              Only {m.verified} of {form.target} verified leads in this area. {m.found - m.withSite} businesses have no website, and the rest are missing what your rules require. Try a bigger radius, another area, or switch off a requirement — nothing was added to fill the gap.
            </p>
          ) : null}
          {notes.length ? <p className="text-xs text-faint">{notes.join(" · ")}</p> : null}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{phase === "checking" ? `Checking websites… ${m.verified} verified so far` : `${m.verified} verified, ready to save`}</p>
            <button type="button" className="btn btn-primary h-10" disabled={!m.verified || saving || busy} onClick={save}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save {m.verified || ""} verified
            </button>
          </div>

          <ul className="space-y-2">
            {list.map((b) => {
              const r = rows[b.id];
              const l = r?.lead;
              return (
                <li key={b.id} className={`card p-4 ${l?.qualified && r?.status === "done" ? "ring-1 ring-(--good)/40" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{b.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-faint">
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{b.distanceKm} km{b.address ? ` · ${b.address}` : ""}</span>
                        {b.website ? (
                          <a href={l?.website ?? b.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-(--color-white)"><Globe className="size-3.5" />Website</a>
                        ) : (
                          <span>No website</span>
                        )}
                      </p>
                    </div>
                    <Status b={b} r={r} />
                  </div>

                  {l ? (
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <Field icon={<UserRound className="size-4" />} label="Owner">
                        {l.owner ? (
                          <a href={l.owner.sourceUrl} target="_blank" rel="noopener noreferrer" title={l.owner.evidence} className="hover:underline">{l.owner.name} · {l.owner.role}</a>
                        ) : (
                          <span className="text-faint">Owner Not Verified</span>
                        )}
                      </Field>
                      <Field icon={<ExternalLink className="size-4" />} label="LinkedIn">
                        {l.owner?.linkedinUrl ? (
                          <a href={l.owner.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Owner profile (linked on site)</a>
                        ) : l.companyLinkedin ? (
                          <a href={l.companyLinkedin.value} target="_blank" rel="noopener noreferrer" className="hover:underline">Company page</a>
                        ) : (
                          <span className="text-faint">
                            LinkedIn Reference Unavailable ·{" "}
                            <a className="underline" target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/search/results/people/?keywords=${enc(`${l.owner?.name ?? ""} ${b.name}`.trim())}`}>search yourself</a>
                          </span>
                        )}
                      </Field>
                      <Field icon={<Mail className="size-4" />} label="Email">
                        {l.email ? (
                          <span title={`${l.emailStatus} · ${l.email.source}`}>{l.email.value}{l.emailStatus !== "Published & verified source" ? <span className="text-amber-300"> (needs review)</span> : null}</span>
                        ) : (
                          <span className="text-faint">Not verified</span>
                        )}
                      </Field>
                      <Field icon={<Phone className="size-4" />} label="Phone">
                        {l.phone ? <span title={l.phone.source}>{l.phone.value}</span> : <span className="text-faint">Not verified</span>}
                      </Field>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-faint">
            Sources: business websites (robots.txt respected), Google Places and OpenStreetMap. LinkedIn is never scraped — profiles appear only when the business’s own website links them.
          </p>
        </>
      ) : null}
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
      <span className="mt-0.5 text-faint">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-faint">{label}</p>
        <div className="truncate">{children}</div>
      </div>
    </div>
  );
}

function Status({ b, r }: { b: Biz; r?: RowState }) {
  const base = "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs";
  if (b.inLeads) return <span className={`${base} bg-white/5 text-muted`}><CheckCircle2 className="size-3.5" />In leads</span>;
  if (!b.website) return <span className={`${base} bg-white/5 text-faint`}>No website — not checked</span>;
  if (!r || r.status === "waiting") return <span className={`${base} bg-white/5 text-faint`}><CircleDashed className="size-3.5" />Not checked</span>;
  if (r.status === "checking") return <span className={`${base} bg-(--accent)/15 text-(--accent-text)`}><Loader2 className="size-3.5 animate-spin" />Checking site</span>;
  if (r.status === "error") return <span className={`${base} bg-rose-400/10 text-rose-300`}><XCircle className="size-3.5" />Site didn’t answer</span>;
  if (r.lead?.qualified) return <span className={`${base} bg-(--good)/15 text-(--good-text)`}><CheckCircle2 className="size-3.5" />Verified lead</span>;
  return <span className={`${base} bg-amber-300/10 text-amber-200`} title={r.lead?.missing.join(", ")}>Needs research: {r.lead?.missing[0]}</span>;
}
