"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Filter,
  Mail,
  Play,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  UserCheck,
  Video,
  Wand2,
} from "lucide-react";
import { LinkedinIcon } from "@/components/ui/LinkedinIcon";
import { PageHeader } from "@/components/app/PageHeader";
import { findScreen } from "@/lib/screens";

export interface LinkedInLead {
  id: string;
  name: string;
  role: string;
  company: string;
  niche: string;
  location: string;
  companySize: string;
  email: string;
  linkedinUrl: string;
  website: string;
  recentActivity: string;
  painPoint: "Text-Only Posts" | "Low-Engagement Video" | "Missing Video Strategy" | "Amateur Thumbnails";
  painPointDetail: string;
  recommendedService: string;
  status: "new" | "saved" | "in_campaign";
}

const INITIAL_LEADS: LinkedInLead[] = [
  {
    id: "li-1",
    name: "Alex Rivera",
    role: "Founder & CEO",
    company: "SaaSFlow AI",
    niche: "SaaS & B2B Tech",
    location: "Austin, TX, USA",
    companySize: "11-50",
    email: "alex@saasflow.io",
    linkedinUrl: "https://linkedin.com/in/alexrivera-mock",
    website: "https://saasflow.io",
    recentActivity: "Posted 3 text-only product breakdown essays this week with 14 likes.",
    painPoint: "Text-Only Posts",
    painPointDetail: "Dense technical text gets buried; high-contrast LinkedIn carousels & infographics will 4× impressions.",
    recommendedService: "Social Media Carousels & Infographics",
    status: "new",
  },
  {
    id: "li-2",
    name: "Elena Rostova",
    role: "Head of Marketing",
    company: "Luxe Realty Group",
    niche: "Real Estate & PropTech",
    location: "Miami, FL, USA",
    companySize: "11-50",
    email: "elena@luxerealty.com",
    linkedinUrl: "https://linkedin.com/in/elenarostova-mock",
    website: "https://luxerealty.com",
    recentActivity: "Posted 2 raw property walk-through videos with no sound design or captions.",
    painPoint: "Low-Engagement Video",
    painPointDetail: "Video lacks dynamic pacing, color grading, visual text hooks, and trending audio.",
    recommendedService: "Short-form Reels & Property Showcase Edits",
    status: "new",
  },
  {
    id: "li-3",
    name: "Marcus Vance",
    role: "Content Creator & Coach",
    company: "Vance Growth Lab",
    niche: "Coaches & Creators",
    location: "London, UK",
    companySize: "1-10",
    email: "marcus@vancegrowth.com",
    linkedinUrl: "https://linkedin.com/in/marcusvance-mock",
    website: "https://vancegrowth.com",
    recentActivity: "Active on LinkedIn but has zero presence on YouTube Shorts or Instagram Reels.",
    painPoint: "Missing Video Strategy",
    painPointDetail: "Leaving thousands of warm organic leads on the table by not repurposing key insights into Shorts.",
    recommendedService: "Full Short-Form Video Repurposing Pipeline",
    status: "new",
  },
  {
    id: "li-4",
    name: "David Chen",
    role: "Chief Marketing Officer",
    company: "Apex Supplements",
    niche: "E-Commerce & DTC",
    location: "Los Angeles, CA, USA",
    companySize: "51-200",
    email: "d.chen@apexsupps.com",
    linkedinUrl: "https://linkedin.com/in/davidchen-mock",
    website: "https://apexsupps.com",
    recentActivity: "YouTube channel has great workout podcasts, but thumbnails look like generic Canva templates.",
    painPoint: "Amateur Thumbnails",
    painPointDetail: "CTR is suffering (<2.5%); custom high-contrast 3D/typography thumbnails will double click-throughs.",
    recommendedService: "High-CTR YouTube Thumbnails & Ad Creatives",
    status: "new",
  },
  {
    id: "li-5",
    name: "Sarah Jenkins",
    role: "Co-Founder",
    company: "PeakPerformance Mindset",
    niche: "Fitness & Health",
    location: "Toronto, Canada",
    companySize: "1-10",
    email: "sarah@peakperformance.ca",
    linkedinUrl: "https://linkedin.com/in/sarahjenkins-mock",
    website: "https://peakperformance.ca",
    recentActivity: "Regularly posts client win stories in plain paragraphs without visual cards.",
    painPoint: "Text-Only Posts",
    painPointDetail: "Needs transformation before/after quote cards and branded carousel templates.",
    recommendedService: "Social Media Carousels & Brand Identity",
    status: "new",
  },
];

const NICHES = [
  "All Niches",
  "SaaS & B2B Tech",
  "Real Estate & PropTech",
  "E-Commerce & DTC",
  "Coaches & Creators",
  "Fitness & Health",
  "Agencies & Consultants",
];

const ROLES = [
  "All Roles",
  "Founder & CEO",
  "Head of Marketing / CMO",
  "Content Creator & Coach",
  "Growth Director",
];

const PAIN_POINTS = [
  "All Pain Points",
  "Text-Only Posts",
  "Low-Engagement Video",
  "Missing Video Strategy",
  "Amateur Thumbnails",
];

export function LinkedInScraper() {
  const screen = findScreen("/linkedin-scraper");

  const [selectedNiche, setSelectedNiche] = useState("All Niches");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [selectedPainPoint, setSelectedPainPoint] = useState("All Pain Points");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [leads, setLeads] = useState<LinkedInLead[]>(INITIAL_LEADS);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [activePitchLead, setActivePitchLead] = useState<LinkedInLead | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchNiche = selectedNiche === "All Niches" || lead.niche === selectedNiche;
      const matchRole = selectedRole === "All Roles" || lead.role.toLowerCase().includes(selectedRole.toLowerCase().split(" ")[0]);
      const matchPain = selectedPainPoint === "All Pain Points" || lead.painPoint === selectedPainPoint;
      const matchText =
        !searchKeyword ||
        lead.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        lead.location.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchNiche && matchRole && matchPain && matchText;
    });
  }, [leads, selectedNiche, selectedRole, selectedPainPoint, searchKeyword]);

  const handleSimulateScrape = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
    }, 1200);
  };

  const toggleSelect = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleExportCsv = () => {
    const rows = filteredLeads.map((l) =>
      `"${l.name}","${l.role}","${l.company}","${l.niche}","${l.email}","${l.painPoint}","${l.website}"`
    );
    const csvContent = "data:text/csv;charset=utf-8,Name,Role,Company,Niche,Email,CreativePainPoint,Website\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `linkedin_creative_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        screen={screen}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="btn btn-secondary text-xs"
              disabled={filteredLeads.length === 0}
            >
              <Download className="size-3.5" />
              Export CSV ({filteredLeads.length})
            </button>
            <Link
              href="/campaigns/new"
              className="btn btn-primary text-xs"
            >
              <Play className="size-3.5" />
              Push {selectedLeadIds.length > 0 ? selectedLeadIds.length : "All"} to Campaign
            </Link>
          </div>
        }
      />

      {/* Scraper Filters Section */}
      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-faint">
                Target Niche
              </label>
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="input h-9 text-xs"
              >
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-faint">
                Role / Title
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input h-9 text-xs"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-faint">
                Creative Pain Point
              </label>
              <select
                value={selectedPainPoint}
                onChange={(e) => setSelectedPainPoint(e.target.value)}
                className="input h-9 text-xs"
              >
                {PAIN_POINTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase text-faint">
                Keyword / Location
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
                <input
                  type="text"
                  placeholder="e.g. Austin, Miami, Tech..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="input h-9 pl-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 lg:pt-5">
            <button
              onClick={handleSimulateScrape}
              disabled={isScraping}
              className="btn btn-primary h-9 px-4 text-xs font-semibold shadow-xs"
            >
              <Search className={`size-3.5 ${isScraping ? "animate-spin" : ""}`} />
              {isScraping ? "Scanning LinkedIn..." : "Run Scraper"}
            </button>
            <button
              onClick={() => {
                setSelectedNiche("All Niches");
                setSelectedRole("All Roles");
                setSelectedPainPoint("All Pain Points");
                setSearchKeyword("");
              }}
              className="btn btn-secondary h-9 px-2.5 text-xs"
              title="Reset Filters"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Live Filter Metric Strip */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-xs text-muted">
          <span className="font-semibold text-fg">
            {filteredLeads.length} Creative Prospects Found
          </span>
          <span className="text-line-strong">•</span>
          <span className="inline-flex items-center gap-1 text-emerald-500">
            <UserCheck className="size-3.5" /> 100% Verified Work Emails
          </span>
          <span className="text-line-strong">•</span>
          <span className="inline-flex items-center gap-1 text-indigo-400">
            <Sparkles className="size-3.5" /> Pain-Point Detection Active
          </span>
        </div>
      </section>

      {/* Leads Table */}
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-raised/50 text-[11px] font-semibold uppercase tracking-wider text-faint">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="size-3.5 rounded border-line accent-brand"
                  />
                </th>
                <th className="px-4 py-3">Prospect & Company</th>
                <th className="px-4 py-3">Target Niche</th>
                <th className="px-4 py-3">Recent Activity</th>
                <th className="px-4 py-3">Detected Creative Gap</th>
                <th className="px-4 py-3">Pitch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className={`transition-colors hover:bg-hover/40 ${
                      isSelected ? "bg-brand-soft/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(lead.id)}
                        className="size-3.5 rounded border-line accent-brand"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-semibold text-fg">
                          <span>{lead.name}</span>
                          <a
                            href={lead.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-400"
                            title="LinkedIn Profile"
                          >
                            <LinkedinIcon className="size-3" />
                          </a>
                        </div>
                        <span className="text-[11px] text-muted">
                          {lead.role} · <strong className="font-medium text-fg">{lead.company}</strong>
                        </span>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-faint">
                          <span>{lead.email}</span>
                          <span>•</span>
                          <span>{lead.location}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="rounded-md bg-raised px-2 py-1 text-[11px] font-medium text-muted">
                        {lead.niche}
                      </span>
                    </td>

                    <td className="max-w-xs px-4 py-3.5">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-muted">
                        {lead.recentActivity}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide w-fit ${
                            lead.painPoint === "Text-Only Posts"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : lead.painPoint === "Low-Engagement Video"
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              : lead.painPoint === "Missing Video Strategy"
                              ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          }`}
                        >
                          {lead.painPoint}
                        </span>
                        <span className="text-[10px] text-faint">
                          👉 Suggest: {lead.recommendedService}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => setActivePitchLead(lead)}
                        className="btn btn-secondary text-[11px] h-8 px-2.5 font-medium"
                      >
                        <Wand2 className="size-3 text-brand" />
                        Preview Pitch
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pitch Preview Modal */}
      {activePitchLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card w-full max-w-xl p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">
                    AI Visual Agency Pitch
                  </span>
                  <span className="text-xs text-muted">to {activePitchLead.name}</span>
                </div>
                <h3 className="mt-1 text-base font-semibold">
                  Personalized Offer for {activePitchLead.company}
                </h3>
              </div>
              <button
                onClick={() => setActivePitchLead(null)}
                className="text-muted hover:text-fg text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg border border-line bg-raised/50 p-4 text-xs leading-relaxed text-muted">
              <p>
                <strong>Subject:</strong> Quick idea on your {activePitchLead.company} video/graphic strategy
              </p>
              <div className="border-t border-line pt-2 text-fg space-y-2">
                <p>Hi {activePitchLead.name.split(" ")[0]},</p>
                <p>
                  I came across your profile and recent activity on LinkedIn. I noticed you&apos;re putting out great insights on {activePitchLead.niche}, but{" "}
                  <strong className="text-amber-500">{activePitchLead.painPointDetail}</strong>
                </p>
                <p>
                  We recently helped a similar brand in your space revamp their visual assets with{" "}
                  <strong>{activePitchLead.recommendedService}</strong>, which generated an extra 140k organic views and cut their cost-per-lead by 35%.
                </p>
                <p>
                  Here are 3 quick video concepts and carousel formats we mocked up for you:{" "}
                  <span className="font-mono text-brand underline cursor-pointer">
                    [Matched_Portfolio_Link/{activePitchLead.niche.toLowerCase().replace(/[^a-z0-9]/g, "-")}]
                  </span>
                </p>
                <p>
                  Would you be open to a 10-minute visual audit call on Thursday to see how we could test this for {activePitchLead.company}?
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setActivePitchLead(null)}
                className="btn btn-secondary text-xs"
              >
                Close
              </button>
              <Link
                href="/campaigns/new"
                className="btn btn-primary text-xs"
              >
                <Send className="size-3.5" />
                Enroll in Automated Campaign
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
