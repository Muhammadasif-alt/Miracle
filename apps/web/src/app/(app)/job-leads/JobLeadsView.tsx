"use client";

import { useState, type FormEvent } from "react";
import { BriefcaseBusiness, Building2, CheckCircle2, Clock, ExternalLink, Loader2, Mail, MapPin, Phone, Plus, Search, Wallet } from "lucide-react";
import { useMe } from "@/lib/session-context";
import { memberForEmail } from "@/lib/team";
import type { JobLead, SourceStatus } from "@/lib/job-leads";
import type { JobContact } from "@/lib/job-contact";

type Country = { code: string; name: string };

const PRESETS: Record<string, string[]> = {
  Designer: ["Graphic Designer", "Video Editor", "Social Media Designer", "UI/UX Designer", "Brand Designer"],
  Developer: ["Web Developer", "WordPress Developer", "Shopify Developer", "App Developer", "SEO Specialist"],
};

const DAYS = [
  { v: 1, label: "24 hours" },
  { v: 3, label: "3 days" },
  { v: 7, label: "7 days" },
  { v: 14, label: "14 days" },
  { v: 30, label: "30 days" },
];

function ago(iso: string | null) {
  if (!iso) return "Date not given";
  const h = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 3_600_000));
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

const pill = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-medium transition ${
    on ? "border-(--accent)/50 bg-(--accent)/15 text-(--accent-text)" : "border-line text-muted hover:text-(--color-white)"
  }`;

export function JobLeadsView({ countries }: { countries: Country[] }) {
  const me = useMe();
  const role = memberForEmail(me.user.email)?.role ?? "Designer";
  const presets = PRESETS[role] ?? PRESETS.Designer!;

  const [form, setForm] = useState({ role: presets[0]!, country: "us", city: "", days: 7, remote: "any" as "any" | "remote" | "onsite" });
  const [busy, setBusy] = useState<"search" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobLead[] | null>(null);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  async function search(e?: FormEvent) {
    e?.preventDefault();
    setBusy("search");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/job-leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", ...form }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setJobs(data.jobs);
      setSources(data.sources);
      setPicked(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setBusy(null);
    }
  }

  const [contacts, setContacts] = useState<Record<string, JobContact | "loading" | "error">>({});

  async function findContact(j: JobLead) {
    setContacts((c) => ({ ...c, [j.id]: "loading" }));
    try {
      const res = await fetch("/api/job-leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "contact", company: j.company, website: j.companyWebsite }) });
      const data = await res.json();
      setContacts((c) => ({ ...c, [j.id]: data.ok ? data.contact : "error" }));
    } catch {
      setContacts((c) => ({ ...c, [j.id]: "error" }));
    }
  }

  async function findSelected() {
    const list = (jobs ?? []).filter((j) => picked.has(j.id) && !contacts[j.id]);
    for (let i = 0; i < list.length; i += 3) await Promise.all(list.slice(i, i + 3).map(findContact));
  }

  async function save(list: JobLead[]) {
    if (!list.length) return;
    setBusy("save");
    setError(null);
    try {
      const res = await fetch("/api/job-leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", jobs: list.map((j) => ({ ...j, contact: typeof contacts[j.id] === "object" ? contacts[j.id] : undefined })) }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSavedIds((s) => new Set([...s, ...list.map((j) => j.id)]));
      setPicked(new Set());
      setNotice(`${data.saved} ${data.saved === 1 ? "company" : "companies"} added to All Leads. Nothing was sent — pitch them from Pitch Studio when ready.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const companies = jobs ? new Set(jobs.map((j) => j.company.toLowerCase())).size : 0;

  return (
    <div className="mx-auto max-w-page space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#6d5dfc]/15 via-transparent to-[#2bb8e8]/10 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#6ad8ff] via-[#8b7bff] to-[#7dffc4] p-[1.5px]">
            <span className="grid size-full place-items-center rounded-[14px] bg-(--n-0a0a11)">
              <BriefcaseBusiness className="size-5 text-white" aria-hidden="true" />
            </span>
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-(--accent-text) uppercase">LinkedIn & job boards</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Job Leads</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Real companies that posted a job for work you do. A company hiring a {presets[0]!.toLowerCase()} is a warm lead — offer your service instead of a hire.
            </p>
          </div>
        </div>

        <form onSubmit={search} className="mt-6 space-y-3">
          <div className="grid gap-3 md:grid-cols-[2fr_1.3fr_1.3fr_auto]">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
              <input className="input h-11 pl-9" aria-label="Role the company is hiring for" placeholder="Role, e.g. Graphic Designer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <select className="input h-11" aria-label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <input className="input h-11" aria-label="City (optional)" placeholder="City (optional)" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <button type="submit" disabled={busy !== null || form.role.trim().length < 2} className="btn btn-primary h-11">
              {busy === "search" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Find companies
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((p) => (
              <button type="button" key={p} className={pill(form.role === p)} onClick={() => setForm({ ...form, role: p })}>{p}</button>
            ))}
            <span className="mx-1 hidden h-4 w-px bg-line sm:block" />
            {(["any", "remote", "onsite"] as const).map((r) => (
              <button type="button" key={r} className={pill(form.remote === r)} onClick={() => setForm({ ...form, remote: r })}>
                {r === "any" ? "Remote + on-site" : r === "remote" ? "Remote only" : "On-site only"}
              </button>
            ))}
            <select className="input h-8 w-auto rounded-full py-0 text-xs" aria-label="Posted within" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}>
              {DAYS.map((d) => (
                <option key={d.v} value={d.v}>Posted in last {d.label}</option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {error ? <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div> : null}
      {notice ? (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-(--good)/30 bg-(--good)/10 px-4 py-3 text-sm text-(--good-text)">
          <CheckCircle2 className="size-4 shrink-0" /> {notice}
        </div>
      ) : null}

      {busy === "search" && !jobs ? (
        <div className="card grid place-items-center gap-3 p-12 text-sm text-muted">
          <Loader2 className="size-6 animate-spin text-(--accent-text)" /> Checking job boards…
        </div>
      ) : null}

      {jobs === null && busy !== "search" ? (
        <div className="card p-10 text-center">
          <Building2 className="mx-auto size-8 text-faint" aria-hidden="true" />
          <p className="mt-3 font-medium">Pick a role and country, then find companies</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">Results are real job posts. Open any company on LinkedIn with one click to see who to contact.</p>
        </div>
      ) : null}

      {jobs ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-sm font-medium">{jobs.length} job posts · {companies} companies</span>
              {sources.map((s) => (
                <span
                  key={s.name}
                  title={s.note}
                  className={`rounded-full border px-2.5 py-1 ${s.status === "ok" ? "border-line text-muted" : s.status === "error" ? "border-rose-400/30 text-rose-300" : "border-dashed border-line text-faint"}`}
                >
                  {s.name}: {s.status === "ok" ? s.count : s.status === "error" ? "no answer" : "off"}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost h-9 text-xs" disabled={busy !== null || !jobs.length} onClick={() => setPicked(picked.size === jobs.length ? new Set() : new Set(jobs.map((j) => j.id)))}>
                {picked.size === jobs.length && jobs.length ? "Clear" : "Select all"}
              </button>
              <button type="button" className="btn btn-ghost h-9 text-xs" disabled={busy !== null || !picked.size} onClick={findSelected}>
                <Mail className="size-4" />Find emails
              </button>
              <button type="button" className="btn btn-primary h-9 text-xs" disabled={busy !== null || !picked.size} onClick={() => save(jobs.filter((j) => picked.has(j.id)))}>
                {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Add {picked.size || ""} to leads
              </button>
            </div>
          </div>

          {sources.some((s) => s.status === "skipped" && s.note?.startsWith("Add")) ? (
            <p className="text-xs text-faint">
              Showing remote job boards only. For LinkedIn / Indeed postings and city search, add <code>JSEARCH_API_KEY</code> or <code>ADZUNA_APP_ID</code> + <code>ADZUNA_APP_KEY</code> in <code>apps/web/.env.local</code>.
            </p>
          ) : null}

          {!jobs.length ? (
            <div className="card p-8 text-center text-sm text-muted">No matching job posts in this window. Try a broader role, a longer date range, or “Remote + on-site”.</div>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {jobs.map((j) => {
                const saved = savedIds.has(j.id);
                return (
                  <li key={j.id} className={`card flex gap-3 p-4 transition ${picked.has(j.id) ? "ring-1 ring-(--accent)/60" : ""}`}>
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0 accent-(--accent)"
                      aria-label={`Select ${j.company}`}
                      checked={picked.has(j.id)}
                      disabled={saved}
                      onChange={() => toggle(j.id)}
                    />
                    {j.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={j.companyLogo} alt="" className="size-10 shrink-0 rounded-xl bg-white object-contain p-1" loading="lazy" />
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--accent)/15 text-sm font-semibold text-(--accent-text)">{j.company[0]}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{j.company}</p>
                      <p className="text-sm text-muted">Hiring: <span className="text-(--color-white)">{j.title}</span></p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-faint">
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{j.location}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{ago(j.postedAt)}</span>
                        {j.salary ? <span className="inline-flex items-center gap-1"><Wallet className="size-3.5" />{j.salary}</span> : null}
                        <span className="rounded-full bg-white/5 px-2 py-0.5">{j.source}{j.publisher ? ` · ${j.publisher}` : ""}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a href={j.url} target="_blank" rel="noopener noreferrer" className={pill(false)}>
                          <ExternalLink className="mr-1 inline size-3.5" />Job post
                        </a>
                        <a href={j.linkedinCompanyUrl} target="_blank" rel="noopener noreferrer" className={pill(false)}>Company on LinkedIn</a>
                        <a href={j.linkedinJobsUrl} target="_blank" rel="noopener noreferrer" className={pill(false)}>Role on LinkedIn</a>
                        {!contacts[j.id] ? (
                          <button type="button" className={pill(false)} onClick={() => findContact(j)}>
                            <Mail className="mr-1 inline size-3.5" />Find email
                          </button>
                        ) : null}
                        {saved ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-(--good-text)"><CheckCircle2 className="size-3.5" />In leads</span>
                        ) : (
                          <button type="button" className={pill(false)} disabled={busy !== null} onClick={() => save([j])}>
                            <Plus className="mr-1 inline size-3.5" />Add to leads
                          </button>
                        )}
                      </div>
                      <ContactLine c={contacts[j.id]} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-[11px] text-faint">
            Jobs from{" "}
            <a className="underline" href="https://himalayas.app" target="_blank" rel="noopener noreferrer">Himalayas</a>,{" "}
            <a className="underline" href="https://jobicy.com" target="_blank" rel="noopener noreferrer">Jobicy</a>
            {sources.some((s) => s.name === "Adzuna" && s.status === "ok") ? ", Adzuna" : ""}
            {sources.some((s) => s.name === "JSearch" && s.status === "ok") ? ", JSearch" : ""}. LinkedIn is never scraped — the LinkedIn buttons open a normal LinkedIn search in your browser.
          </p>
        </>
      ) : null}
    </div>
  );
}

function ContactLine({ c }: { c?: JobContact | "loading" | "error" }) {
  if (!c) return null;
  if (c === "loading") return <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted"><Loader2 className="size-3.5 animate-spin" />Checking the company website…</p>;
  if (c === "error") return <p className="mt-2 text-xs text-rose-300">Couldn't check right now — try again.</p>;
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1" title={c.email?.source}>
        <Mail className="size-3.5 text-faint" />
        {c.email ? <span className="text-(--good-text)">{c.email.value}</span> : <span className="text-faint">Email not verified</span>}
      </span>
      <span className="inline-flex items-center gap-1" title={c.phone?.source}>
        <Phone className="size-3.5 text-faint" />
        {c.phone ? c.phone.value : <span className="text-faint">Phone not verified</span>}
      </span>
      {c.website ? (
        <a className="text-faint underline" href={c.website} target="_blank" rel="noopener noreferrer" title={c.websiteNote}>Company website</a>
      ) : (
        <span className="text-faint">{c.websiteNote}</span>
      )}
      {c.linkedin ? <a className="text-faint underline" href={c.linkedin.value} target="_blank" rel="noopener noreferrer">LinkedIn page</a> : null}
    </div>
  );
}
