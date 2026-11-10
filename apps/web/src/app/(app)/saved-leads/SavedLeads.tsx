"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  MapPin,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { LinkedinIcon } from "@/components/ui/LinkedinIcon";
import type { ScrapedLead } from "@/lib/scraper-engine";

const SEED_SAVED_LEADS: ScrapedLead[] = [
  {
    id: "lead-seed-1",
    source: "google_maps",
    businessName: "Skyline Luxury Realty Group",
    contactName: "Julian Ross",
    role: "Managing Broker",
    category: "Real Estate",
    niche: "Real Estate Agents & Luxury Brokers",
    city: "Austin, TX",
    country: "US",
    phone: "+1 (512) 488-2910",
    email: "julian@skylinerealty.com",
    websiteUrl: "https://skylinerealty.com",
    instagramUrl: "https://instagram.com/skylineluxury",
    creativeTriggers: ["Needs Short-Form Video (Reels/Shorts)", "Missing Drone Walkthroughs"],
    suggestedPitch: "I noticed Skyline Realty has premier listings on Google, but your Instagram lacks high-retention 9:16 walkthrough reels to attract millennial home buyers.",
    matchedPortfolioUrl: "https://www.behance.net/zohaibahamd",
    matchedService: "Short-Form Video Editing (Reels & Shorts)",
    dateExtracted: "2026-11-04",
  },
  {
    id: "lead-seed-2",
    source: "linkedin",
    businessName: "Nexus Fitness & Performance",
    contactName: "Marcus Vance",
    role: "Founder & Head Coach",
    category: "Fitness & Gyms",
    niche: "Fitness Trainers & Crossfit Gyms",
    city: "Miami, FL",
    country: "US",
    email: "marcus@nexusfitness.com",
    linkedinUrl: "https://linkedin.com/in/marcusvance-mock",
    creativeTriggers: ["Text-Only LinkedIn Posts", "Needs High-ROAS Ad Creatives"],
    suggestedPitch: "Saw your recent post on performance training. Converting your fitness breakdowns into viral visual carousels and high-energy ad creatives will easily double your member signups.",
    matchedPortfolioUrl: "https://www.behance.net/gallery/viral-retention-showreel",
    matchedService: "High-ROAS Ad Creatives & Social Banners",
    dateExtracted: "2026-11-04",
  },
  {
    id: "lead-seed-3",
    source: "google_maps",
    businessName: "Bistro Lumière Artisan Bakery",
    contactName: "Elena Rostova",
    role: "Co-Owner & Chef",
    category: "Restaurants & Cafes",
    niche: "Fine Dining & Artisan Cafes",
    city: "Los Angeles, CA",
    country: "US",
    phone: "+1 (310) 902-1144",
    email: "contact@bistrolumiere.la",
    websiteUrl: "https://bistrolumiere.la",
    instagramUrl: "https://instagram.com/bistrolumiere",
    creativeTriggers: ["Outdated Branding / Needs Visual Revamp", "Low Google Photos (<10)"],
    suggestedPitch: "We love your artisan pastries! Your brand identity could look significantly more upscale with a sleek vector logo revamp and 30 branded social media templates.",
    matchedPortfolioUrl: "https://behance.net/gallery/artisan-bakery-branding",
    matchedService: "Brand Identity & Modern Graphic Design",
    dateExtracted: "2026-11-03",
  },
  {
    id: "lead-seed-4",
    source: "linkedin",
    businessName: "Apex Crypto & Finance Daily",
    contactName: "Alex Rivera",
    role: "Executive Creator",
    category: "YouTubers & Creators",
    niche: "YouTube Creators & Streamers",
    city: "New York, NY",
    country: "US",
    email: "alex@apexcrypto.media",
    youtubeUrl: "https://youtube.com/@apexcrypto",
    linkedinUrl: "https://linkedin.com/in/alexrivera-mock",
    creativeTriggers: ["Needs YouTube Long-Form & CTR Thumbnails", "Low Video Retention Rate"],
    suggestedPitch: "We audited your recent YouTube uploads. With custom 3D lighting thumbnails and tighter retention-based pacing, you could boost your channel CTR from 4% to 12%+.",
    matchedPortfolioUrl: "https://www.behance.net/gallery/yt-ctr-thumbnails",
    matchedService: "CTR Thumbnails & Long-Form Editing",
    dateExtracted: "2026-11-02",
  },
];

export function SavedLeads() {
  const [leads, setLeads] = useState<ScrapedLead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [nicheFilter, setNicheFilter] = useState<string>("all");

  // Load from local storage or seed
  useEffect(() => {
    try {
      const stored = localStorage.getItem("miracle_saved_leads");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLeads(parsed);
          return;
        }
      }
    } catch {}
    setLeads(SEED_SAVED_LEADS);
    localStorage.setItem("miracle_saved_leads", JSON.stringify(SEED_SAVED_LEADS));
  }, []);

  const niches = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(l.niche));
    return Array.from(set);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchSource = sourceFilter === "all" || l.source === sourceFilter;
      const matchNiche = nicheFilter === "all" || l.niche === nicheFilter;
      const matchSearch =
        searchQuery.trim() === "" ||
        l.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.contactName && l.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.creativeTriggers.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchSource && matchNiche && matchSearch;
    });
  }, [leads, sourceFilter, nicheFilter, searchQuery]);

  const handleDelete = (id: string) => {
    const updated = leads.filter((l) => l.id !== id);
    setLeads(updated);
    localStorage.setItem("miracle_saved_leads", JSON.stringify(updated));
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Business Name", "Contact", "Role", "Email", "Phone", "Website", "Social", "Creative Gaps", "Matched Proof"];
    const rows = filteredLeads.map((l) => [
      `"${l.businessName}"`,
      `"${l.contactName || ""}"`,
      `"${l.role || ""}"`,
      `"${l.email || ""}"`,
      `"${l.phone || ""}"`,
      `"${l.websiteUrl || ""}"`,
      `"${l.instagramUrl || l.linkedinUrl || ""}"`,
      `"${l.creativeTriggers.join(" | ")}"`,
      `"${l.matchedPortfolioUrl}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `miracle_saved_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="2. My Saved Leads"
        description="Filter, export, and launch outreach campaigns to all contacts extracted from Google Maps & LinkedIn."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary h-9 px-3.5 text-xs inline-flex items-center gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Export CSV ({filteredLeads.length})</span>
          </button>
          <Link
            href="/outreach"
            className="btn-primary h-9 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-[#8B5CF6]/30"
          >
            <Send className="size-3.5" />
            <span>Launch Outreach Sequence →</span>
          </Link>
        </div>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, emails, visual gaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input h-9 pl-9 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input h-9 text-xs w-36"
          >
            <option value="all">All Sources</option>
            <option value="google_maps">Google Maps</option>
            <option value="linkedin">LinkedIn X-Ray</option>
          </select>

          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="input h-9 text-xs w-44"
          >
            <option value="all">All Niches ({leads.length})</option>
            {niches.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <Users className="size-10 text-[#64748B] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-white">No saved leads found</h4>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Run the Google Maps or LinkedIn scraper in Tab 1 to collect verified leads and creative gaps.
          </p>
          <Link href="/lead-hunter" className="btn-primary text-xs px-4 py-2 inline-flex mt-2">
            Go to Lead Hunter →
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#12141C] border-b border-[#2A2E3D] text-[#94A3B8] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Business / Prospect</th>
                <th className="px-4 py-3">Source & Location</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3">Detected Creative Gaps</th>
                <th className="px-4 py-3">Matched Proof Link</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E3D]">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#12141C]/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white text-sm">{lead.businessName}</div>
                    <div className="text-[#94A3B8] text-[11px] mt-0.5">
                      {lead.contactName} {lead.role ? `· ${lead.role}` : ""}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#12141C] border border-[#2A2E3D] text-white">
                      {lead.source === "google_maps" ? (
                        <>
                          <MapPin className="size-3 text-[#F43F5E]" />
                          <span>Google Maps</span>
                        </>
                      ) : (
                        <>
                          <LinkedinIcon className="size-3 text-[#8B5CF6]" />
                          <span>LinkedIn</span>
                        </>
                      )}
                    </span>
                    <div className="text-[11px] text-[#64748B] mt-1">{lead.city}</div>
                  </td>

                  <td className="px-4 py-3 space-y-1">
                    {lead.email && (
                      <div className="text-[#E2E8F0] font-mono text-[11px]">
                        {lead.email}
                      </div>
                    )}
                    {lead.phone && (
                      <div className="text-[#94A3B8] text-[11px]">{lead.phone}</div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {lead.creativeTriggers.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <a
                      href={lead.matchedPortfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#8B5CF6] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <span className="truncate max-w-[140px]">{lead.matchedService}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href="/outreach"
                        className="btn-primary h-7 px-2.5 text-[11px] inline-flex items-center gap-1"
                      >
                        <Send className="size-3" />
                        <span>Pitch</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(lead.id)}
                        className="p-1 rounded text-[#64748B] hover:text-[#EF4444] transition-colors"
                        title="Delete lead"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
