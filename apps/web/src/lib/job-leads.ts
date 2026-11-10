import "server-only";

/**
 * Job Leads — companies that are hiring right now for work we can do (design, development…).
 * A company posting "we need a graphic designer" is a warm lead for the studio.
 *
 * Only official job APIs are used. LinkedIn itself is never scraped (its terms forbid it): every result
 * carries plain links that open the same role / company on LinkedIn in the user's own browser.
 *
 *   Himalayas   free, no key            remote jobs, searchable by role + country
 *   Jobicy      free, no key            remote jobs (credit + link to the original post required)
 *   Adzuna      ADZUNA_APP_ID/APP_KEY   local jobs by city in ~19 countries
 *   JSearch     JSEARCH_API_KEY         RapidAPI aggregator incl. LinkedIn / Indeed postings, any country
 */

export type JobSource = "Himalayas" | "Jobicy" | "Adzuna" | "JSearch";

export interface JobLead {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyWebsite?: string;
  location: string;
  remote: boolean;
  postedAt: string | null;
  employmentType?: string;
  salary?: string;
  url: string;
  source: JobSource;
  /** Where the job was originally published, when the API says (e.g. "LinkedIn"). */
  publisher?: string;
  linkedinJobsUrl: string;
  linkedinCompanyUrl: string;
}

export interface SourceStatus {
  name: JobSource;
  status: "ok" | "skipped" | "error";
  count: number;
  note?: string;
}

export interface JobSearchInput {
  role: string;
  country: string; // ISO-2, lowercase
  city?: string;
  days: number;
  remote: "any" | "remote" | "onsite";
}

/** code → name, Jobicy geo slug, whether Adzuna covers it. */
export const JOB_COUNTRIES: { code: string; name: string; jobicy?: string; adzuna?: boolean }[] = [
  { code: "us", name: "United States", jobicy: "usa", adzuna: true },
  { code: "gb", name: "United Kingdom", jobicy: "uk", adzuna: true },
  { code: "ca", name: "Canada", jobicy: "canada", adzuna: true },
  { code: "au", name: "Australia", jobicy: "australia", adzuna: true },
  { code: "de", name: "Germany", jobicy: "germany", adzuna: true },
  { code: "fr", name: "France", jobicy: "france", adzuna: true },
  { code: "nl", name: "Netherlands", jobicy: "netherlands", adzuna: true },
  { code: "es", name: "Spain", jobicy: "spain", adzuna: true },
  { code: "it", name: "Italy", jobicy: "italy", adzuna: true },
  { code: "in", name: "India", adzuna: true },
  { code: "sg", name: "Singapore", adzuna: true },
  { code: "nz", name: "New Zealand", adzuna: true },
  { code: "za", name: "South Africa", adzuna: true },
  { code: "ae", name: "United Arab Emirates", jobicy: "uae" },
  { code: "sa", name: "Saudi Arabia" },
  { code: "pk", name: "Pakistan" },
  { code: "ie", name: "Ireland", jobicy: "ireland" },
];

const STOP = new Set(["and", "the", "for", "with", "senior", "junior", "lead", "remote"]);

function words(s: string) {
  return s.toLowerCase().split(/[^a-z0-9+#]+/).filter((w) => w.length >= 2 && !STOP.has(w));
}

/** Keep a job only when its title actually matches the role asked for (APIs match loosely). */
function relevant(title: string, role: string) {
  const want = words(role);
  if (!want.length) return true;
  const t = title.toLowerCase();
  const hits = want.filter((w) => t.includes(w)).length;
  // "Graphic Designer" must not match "Product Designer": short roles need every word, longer ones most.
  return want.length <= 2 ? hits === want.length : hits / want.length >= 0.6;
}

const enc = encodeURIComponent;

function linkedinLinks(role: string, company: string, location: string) {
  return {
    linkedinJobsUrl: `https://www.linkedin.com/jobs/search/?keywords=${enc(`${role} ${company}`)}&location=${enc(location)}`,
    linkedinCompanyUrl: `https://www.linkedin.com/search/results/companies/?keywords=${enc(company)}`,
  };
}

function money(min?: number | null, max?: number | null, cur?: string | null, per?: string | null) {
  if (!min && !max) return undefined;
  const f = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
  const range = min && max && min !== max ? `${f(min)}–${f(max)}` : f((min || max)!);
  return `${cur ?? ""} ${range}${per ? ` / ${per.replace(/ly$/, "").replace("annual", "year")}` : ""}`.trim();
}

async function getJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000), headers: { Accept: "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const countryName = (code: string) => JOB_COUNTRIES.find((c) => c.code === code)?.name ?? code.toUpperCase();

async function fromHimalayas(q: JobSearchInput): Promise<JobLead[]> {
  const url = `https://himalayas.app/jobs/api/search?q=${enc(q.role)}&country=${enc(q.country.toUpperCase())}&limit=40`;
  const data = await getJson(url);
  return ((data.jobs ?? []) as any[]).map((j) => {
    const location = `Remote · ${countryName(q.country)}`;
    return {
      id: `himalayas:${j.guid ?? j.applicationLink}`,
      title: j.title,
      company: j.companyName,
      companyLogo: j.companyLogo ?? undefined,
      location,
      remote: true,
      postedAt: j.pubDate ? new Date(j.pubDate * 1000).toISOString() : null,
      employmentType: j.employmentType ?? undefined,
      salary: money(j.minSalary, j.maxSalary, j.currency, j.salaryPeriod),
      url: j.applicationLink ?? j.guid,
      source: "Himalayas" as const,
      ...linkedinLinks(q.role, j.companyName, countryName(q.country)),
    };
  });
}

async function fromJobicy(q: JobSearchInput): Promise<JobLead[]> {
  const geo = JOB_COUNTRIES.find((c) => c.code === q.country)?.jobicy;
  const tag = words(q.role).at(-1) ?? q.role;
  const url = `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${enc(tag)}${geo ? `&geo=${geo}` : ""}`;
  const data = await getJson(url);
  return ((data.jobs ?? []) as any[]).map((j) => ({
    id: `jobicy:${j.id}`,
    title: decode(j.jobTitle),
    company: decode(j.companyName),
    companyLogo: j.companyLogo ?? undefined,
    location: `Remote · ${j.jobGeo ?? "Anywhere"}`,
    remote: true,
    postedAt: j.pubDate ? new Date(j.pubDate).toISOString() : null,
    employmentType: Array.isArray(j.jobType) ? j.jobType.join(", ") : undefined,
    salary: money(j.salaryMin, j.salaryMax, j.salaryCurrency, j.salaryPeriod),
    url: j.url,
    source: "Jobicy" as const,
    ...linkedinLinks(q.role, decode(j.companyName), countryName(q.country)),
  }));
}

async function fromAdzuna(q: JobSearchInput): Promise<JobLead[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  const params = new URLSearchParams({
    app_id: id!,
    app_key: key!,
    results_per_page: "40",
    what: q.role,
    max_days_old: String(q.days),
    sort_by: "date",
  });
  if (q.city) params.set("where", q.city);
  const data = await getJson(`https://api.adzuna.com/v1/api/jobs/${q.country}/search/1?${params}`);
  return ((data.results ?? []) as any[]).map((j) => {
    const company = j.company?.display_name ?? "Unknown company";
    const location = j.location?.display_name ?? countryName(q.country);
    return {
      id: `adzuna:${j.id}`,
      title: j.title?.replace(/<[^>]+>/g, "") ?? "",
      company,
      location,
      remote: /remote/i.test(`${j.title} ${location}`),
      postedAt: j.created ?? null,
      employmentType: j.contract_time ?? undefined,
      salary: money(j.salary_min, j.salary_max, null, "year"),
      url: j.redirect_url,
      source: "Adzuna" as const,
      ...linkedinLinks(q.role, company, location),
    };
  });
}

async function fromJSearch(q: JobSearchInput): Promise<JobLead[]> {
  const where = [q.city, countryName(q.country)].filter(Boolean).join(", ");
  const datePosted = q.days <= 1 ? "today" : q.days <= 3 ? "3days" : q.days <= 7 ? "week" : "month";
  const params = new URLSearchParams({ query: `${q.role} in ${where}`, page: "1", num_pages: "2", country: q.country, date_posted: datePosted });
  if (q.remote === "remote") params.set("work_from_home", "true");
  const data = await getJson(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: { "X-RapidAPI-Key": process.env.JSEARCH_API_KEY!, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
  });
  return ((data.data ?? []) as any[]).map((j) => {
    const location = [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") || where;
    return {
      id: `jsearch:${j.job_id}`,
      title: j.job_title,
      company: j.employer_name,
      companyLogo: j.employer_logo ?? undefined,
      companyWebsite: j.employer_website ?? undefined,
      location: j.job_is_remote ? `Remote · ${location}` : location,
      remote: !!j.job_is_remote,
      postedAt: j.job_posted_at_datetime_utc ?? null,
      employmentType: j.job_employment_type ?? undefined,
      salary: money(j.job_min_salary, j.job_max_salary, j.job_salary_currency, j.job_salary_period),
      url: j.job_apply_link,
      source: "JSearch" as const,
      publisher: j.job_publisher ?? undefined,
      ...linkedinLinks(q.role, j.employer_name, location),
    };
  });
}

function decode(s: string) {
  return String(s ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&rsquo;|&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&hellip;/g, "…");
}

export async function searchJobLeads(q: JobSearchInput): Promise<{ jobs: JobLead[]; sources: SourceStatus[] }> {
  const country = JOB_COUNTRIES.find((c) => c.code === q.country);
  const wantsRemote = q.remote !== "onsite";
  const plan: { name: JobSource; run?: () => Promise<JobLead[]>; skip?: string }[] = [
    { name: "JSearch", ...(process.env.JSEARCH_API_KEY ? { run: () => fromJSearch(q) } : { skip: "Add JSEARCH_API_KEY (RapidAPI) for LinkedIn & Indeed postings" }) },
    {
      name: "Adzuna",
      ...(!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY
        ? { skip: "Add ADZUNA_APP_ID + ADZUNA_APP_KEY for local city jobs" }
        : !country?.adzuna
          ? { skip: `Adzuna doesn't cover ${countryName(q.country)}` }
          : { run: () => fromAdzuna(q) }),
    },
    { name: "Himalayas", ...(wantsRemote ? { run: () => fromHimalayas(q) } : { skip: "Remote jobs only" }) },
    { name: "Jobicy", ...(wantsRemote ? { run: () => fromJobicy(q) } : { skip: "Remote jobs only" }) },
  ];

  const cutoff = Date.now() - q.days * 86_400_000;
  const settled = await Promise.allSettled(plan.map((p) => (p.run ? p.run() : Promise.resolve([]))));
  const sources: SourceStatus[] = [];
  const seen = new Set<string>();
  const jobs: JobLead[] = [];

  settled.forEach((r, i) => {
    const p = plan[i]!;
    if (!p.run) return sources.push({ name: p.name, status: "skipped", count: 0, note: p.skip });
    if (r.status === "rejected") return sources.push({ name: p.name, status: "error", count: 0, note: "Source didn't answer — try again" });
    let n = 0;
    for (const j of r.value) {
      if (!j.title || !j.company || !j.url) continue;
      if (!relevant(j.title, q.role)) continue;
      if (j.postedAt && new Date(j.postedAt).getTime() < cutoff) continue;
      if (q.remote === "remote" && !j.remote) continue;
      if (q.remote === "onsite" && j.remote) continue;
      const key = `${j.company}|${j.title}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
      if (seen.has(key)) continue;
      seen.add(key);
      jobs.push(j);
      n++;
    }
    sources.push({ name: p.name, status: "ok", count: n });
  });

  jobs.sort((a, b) => (b.postedAt ? Date.parse(b.postedAt) : 0) - (a.postedAt ? Date.parse(a.postedAt) : 0));
  return { jobs: jobs.slice(0, 80), sources };
}
