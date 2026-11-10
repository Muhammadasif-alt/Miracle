"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  FolderHeart,
  GitBranch,
  Globe,
  Inbox,
  LayoutGrid,
  Mail,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Table as TableIcon,
  Video,
  X,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { PitchModal, type PitchLead } from "@/components/leads/PitchModal";

export type PipelineStage =
  | "DISCOVERED"
  | "AUDITED"
  | "QUALIFIED"
  | "DRAFT_READY"
  | "CONTACTED"
  | "REPLIED"
  | "MEETING_BOOKED"
  | "NOT_QUALIFIED";

export interface PipelineLead {
  id: string;
  businessName: string;
  niche: string;
  city: string;
  country: string;
  website: string;
  email?: string;
  emailStatus: "VERIFIED" | "DISCOVERED" | "UNVERIFIED" | "UNAVAILABLE";
  leadScore: number;
  stage: PipelineStage;
  auditFindings: string;
  recommendedService: string;
  matchedBehanceTitle?: string;
  matchedBehanceUrl?: string;
  lastActivityAt: string;
}

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: "DISCOVERED", label: "Discovered", color: "#888888" },
  { key: "AUDITED", label: "Audited", color: "#38BDF8" },
  { key: "QUALIFIED", label: "Qualified", color: "#10B981" },
  { key: "DRAFT_READY", label: "Draft Ready", color: "#F59E0B" },
  { key: "CONTACTED", label: "Contacted", color: "#6366F1" },
  { key: "REPLIED", label: "Replied", color: "#EC4899" },
  { key: "MEETING_BOOKED", label: "Meeting Booked", color: "#10B981" },
];

const INITIAL_PIPELINE_LEADS: PipelineLead[] = [
  {
    id: "lead-1",
    businessName: "Apex Luxury Properties",
    niche: "Real Estate",
    city: "Dubai",
    country: "United Arab Emirates",
    website: "https://apexluxuryproperties.ae",
    email: "marcus@apexluxuryproperties.ae",
    emailStatus: "VERIFIED",
    leadScore: 94,
    stage: "MEETING_BOOKED",
    auditFindings: "Luxury listings lack high-converting short-form reels; typography and branding are premium.",
    recommendedService: "Luxury Property Showreels & Motion Branding",
    matchedBehanceTitle: "Behance Creative Profile",
    matchedBehanceUrl: "https://www.behance.net/zohaibahamd",
    lastActivityAt: "Today at 10:14 AM",
  },
  {
    id: "lead-2",
    businessName: "Vanguard Dental Aesthetics",
    niche: "Dental & Clinics",
    city: "New York",
    country: "United States",
    website: "https://vanguarddentalnyc.com",
    email: "dr.elena@vanguarddentalnyc.com",
    emailStatus: "VERIFIED",
    leadScore: 88,
    stage: "REPLIED",
    auditFindings: "High volume of 5-star reviews but clinic social proof is static with zero patient journey reels.",
    recommendedService: "Patient Transformation Video Proof & Ad Collateral",
    matchedBehanceTitle: "High-Converting Aesthetic Clinic Social Collateral",
    matchedBehanceUrl: "https://www.behance.net/gallery/aesthetic-clinic-collateral",
    lastActivityAt: "Yesterday at 4:32 PM",
  },
  {
    id: "lead-3",
    businessName: "Elevate Athletic Studio",
    niche: "Fitness Trainers",
    city: "London",
    country: "United Kingdom",
    website: "https://elevateathletic.co.uk",
    email: "contact@elevateathletic.co.uk",
    emailStatus: "DISCOVERED",
    leadScore: 91,
    stage: "CONTACTED",
    auditFindings: "Membership CTA is buried below the fold; mobile speed is fast but visual hierarchy is plain.",
    recommendedService: "High-Ticket Membership Landing Visuals & Video Hooks",
    matchedBehanceTitle: "Viral Retention Short-Form & YouTube Showreel",
    matchedBehanceUrl: "https://www.behance.net/gallery/viral-retention-showreel",
    lastActivityAt: "2 days ago",
  },
  {
    id: "lead-4",
    businessName: "Nexus Commerce Lab",
    niche: "E-Commerce",
    city: "Austin",
    country: "United States",
    website: "https://nexuscommercelab.io",
    email: "growth@nexuscommercelab.io",
    emailStatus: "VERIFIED",
    leadScore: 86,
    stage: "DRAFT_READY",
    auditFindings: "Product catalog is extensive; lack of short-form product demo reels and high CTR thumbnails.",
    recommendedService: "High-CTR Product Reels & Motion Ad Creatives",
    matchedBehanceTitle: "Viral Retention Short-Form & YouTube Showreel",
    matchedBehanceUrl: "https://www.behance.net/gallery/viral-retention-showreel",
    lastActivityAt: "3 days ago",
  },
  {
    id: "lead-5",
    businessName: "Crestview Capital Advisory",
    niche: "B2B Finance",
    city: "Toronto",
    country: "Canada",
    website: "https://crestviewadvisory.ca",
    email: "info@crestviewadvisory.ca",
    emailStatus: "DISCOVERED",
    leadScore: 82,
    stage: "QUALIFIED",
    auditFindings: "Executive whitepapers available but website lacks visual infographics and case-study layout.",
    recommendedService: "B2B Brand Kit, Presentation Deck & Infographics",
    matchedBehanceTitle: "Behance Creative Profile",
    matchedBehanceUrl: "https://www.behance.net/zohaibahamd",
    lastActivityAt: "4 days ago",
  },
  {
    id: "lead-6",
    businessName: "Horizon Architecture Studio",
    niche: "Architecture",
    city: "San Francisco",
    country: "United States",
    website: "https://horizonarchitects.com",
    email: "hello@horizonarchitects.com",
    emailStatus: "UNVERIFIED",
    leadScore: 78,
    stage: "AUDITED",
    auditFindings: "High-resolution architectural renders present; no video flythroughs or mobile-first project showcase.",
    recommendedService: "Architectural 3D Motion & Video Walkthroughs",
    matchedBehanceTitle: "Behance Creative Profile",
    matchedBehanceUrl: "https://www.behance.net/zohaibahamd",
    lastActivityAt: "5 days ago",
  },
  {
    id: "lead-7",
    businessName: "Summit Performance Physio",
    niche: "Physiotherapy",
    city: "Sydney",
    country: "Australia",
    website: "https://summitphysio.com.au",
    email: "bookings@summitphysio.com.au",
    emailStatus: "DISCOVERED",
    leadScore: 74,
    stage: "DISCOVERED",
    auditFindings: "Standard clinic directory listing; basic responsive layout without modern interactive booking.",
    recommendedService: "Brand Refresh & Mobile Video Consultation Flow",
    matchedBehanceTitle: "High-Converting Aesthetic Clinic Social Collateral",
    matchedBehanceUrl: "https://www.behance.net/gallery/aesthetic-clinic-collateral",
    lastActivityAt: "1 week ago",
  },
];

export function PipelineView() {
  const [leads, setLeads] = useState<PipelineLead[]>(INITIAL_PIPELINE_LEADS);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [pitchingLead, setPitchingLead] = useState<PitchLead | null>(null);

  // Load any newly discovered leads from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("miracle_scraped_leads");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted: PipelineLead[] = parsed.map((item: any, idx: number) => ({
            id: item.id || `dyn-${idx}`,
            businessName: item.businessName || item.channelName || "Lead " + (idx + 1),
            niche: item.niche || "Creative Agency",
            city: item.city || "Global",
            country: item.country || "United States",
            website: item.website || "https://example.com",
            email: item.email || (item.handle ? `${item.handle}@gmail.com` : "contact@domain.com"),
            emailStatus: item.email ? "VERIFIED" : "DISCOVERED",
            leadScore: item.leadScore || 85,
            stage: idx === 0 ? "QUALIFIED" : "DISCOVERED",
            auditFindings: item.personalizedHook || "Observed mobile optimization and video retention potential.",
            recommendedService: "Creative Video Retainer & Brand Kit",
            matchedBehanceTitle: "Behance Case Study",
            matchedBehanceUrl: "",
            lastActivityAt: "Just now",
          }));

          // Merge without duplicates
          setLeads((prev) => {
            const map = new Map<string, PipelineLead>();
            prev.forEach((p) => map.set(p.businessName, p));
            formatted.forEach((f) => {
              if (!map.has(f.businessName)) map.set(f.businessName, f);
            });
            return Array.from(map.values());
          });
        }
      }
    } catch {}
  }, []);

  const handleStageChange = (leadId: string, newStage: PipelineStage) => {
    const updated = leads.map((l) => (l.id === leadId ? { ...l, stage: newStage, lastActivityAt: "Just now" } : l));
    setLeads(updated);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, stage: newStage, lastActivityAt: "Just now" });
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchStage = selectedStage === "ALL" || l.stage === selectedStage;
    const matchSearch =
      !searchQuery ||
      l.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.niche.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStage && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <PageHeader
            title="Lead Pipeline & CRM"
            description="Track client opportunities across all 7 operational lifecycle stages: Discovered to Audited, Qualified, Contacted, and Booked."
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-[8px] bg-[#161616] p-1 border border-[#262626]">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                viewMode === "kanban"
                  ? "bg-[#252525] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Kanban</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-[#252525] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <TableIcon className="size-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Link
            href="/lead-hunter"
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#10B981] px-3.5 py-2 text-xs font-semibold text-black hover:bg-[#0EA5E9] transition-all"
          >
            <Plus className="size-3.5" />
            <span>Discover Leads</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121212] border border-[#222222] p-3 rounded-[12px]">
        <div className="relative w-full sm:w-72">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
          <input
            type="text"
            placeholder="Search by company, niche, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 bg-[#181818] border-[#2A2A2A] text-xs text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedStage("ALL")}
            className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-all shrink-0 ${
              selectedStage === "ALL"
                ? "bg-white text-black font-semibold"
                : "bg-[#181818] text-[#888888] hover:text-white"
            }`}
          >
            All Leads ({leads.length})
          </button>

          {STAGES.map((s) => {
            const count = leads.filter((l) => l.stage === s.key).length;
            const active = selectedStage === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSelectedStage(s.key)}
                className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  active
                    ? "bg-[#222222] text-white border border-[#333333] font-semibold"
                    : "bg-[#161616] text-[#71717A] hover:text-white"
                }`}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.key);
            return (
              <div
                key={stage.key}
                className="rounded-[14px] bg-[#121212] border border-[#222222] p-3 space-y-3 min-w-[240px] flex flex-col h-full"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#202020]">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs font-semibold text-white tracking-tight">{stage.label}</span>
                  </div>
                  <span className="rounded-full bg-[#181818] border border-[#262626] px-2 py-0.5 text-[10px] font-mono text-[#888888]">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[680px] scrollbar-none">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#555555]">
                      No leads in this stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="rounded-[10px] bg-[#181818] border border-[#262626] p-3 space-y-2 hover:border-[#383838] transition-all cursor-pointer shadow-sm group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-white group-hover:text-[#10B981] transition-colors truncate">
                            {lead.businessName}
                          </p>
                          <span className="rounded-full bg-[#10B981]/10 px-1.5 py-0.2 text-[9px] font-mono text-[#10B981] border border-[#10B981]/20 shrink-0">
                            {lead.leadScore}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#888888] truncate">
                          {lead.niche} &bull; {lead.city}
                        </p>

                        <div className="p-1.5 rounded bg-[#121212] border border-[#202020] text-[10px] text-[#A1A1AA] line-clamp-2">
                          {lead.auditFindings}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-[#222222]">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${lead.emailStatus === "VERIFIED" ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#F59E0B]/10 text-[#F59E0B]"}`}>
                            {lead.emailStatus}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPitchingLead({
                                id: lead.id,
                                businessName: lead.businessName,
                                email: lead.email,
                                website: lead.website,
                                niche: lead.niche,
                                city: lead.city,
                                country: lead.country,
                                leadScore: lead.leadScore,
                                auditFinding: lead.auditFindings,
                                recommendedService: lead.recommendedService,
                              });
                            }}
                            className="text-[10px] text-white hover:text-[#10B981] font-medium"
                          >
                            Pitch &rarr;
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="rounded-[14px] bg-[#121212] border border-[#222222] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A1A1AA]">
              <thead className="bg-[#181818] text-[#71717A] text-[10px] font-semibold uppercase tracking-wider border-b border-[#222222]">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Niche & Location</th>
                  <th className="px-4 py-3">Contact Email</th>
                  <th className="px-4 py-3">Audit Score</th>
                  <th className="px-4 py-3">Pipeline Stage</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-[#181818] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      <div>
                        <p className="font-semibold">{lead.businessName}</p>
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
                        >
                          <span>{lead.website.replace("https://", "")}</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-white">{lead.niche}</p>
                      <p className="text-[11px] text-[#71717A]">{lead.city}, {lead.country}</p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-white text-[11px]">{lead.email || "No direct email"}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${lead.emailStatus === "VERIFIED" ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#F59E0B]/10 text-[#F59E0B]"}`}>
                          {lead.emailStatus}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{lead.leadScore}/100</span>
                        <div className="w-16 h-1.5 rounded-full bg-[#222222] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#10B981]"
                            style={{ width: `${lead.leadScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={lead.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as PipelineStage)}
                        className="bg-[#181818] border border-[#282828] text-white text-xs rounded px-2 py-1"
                      >
                        {STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPitchingLead({
                            id: lead.id,
                            businessName: lead.businessName,
                            email: lead.email,
                            website: lead.website,
                            niche: lead.niche,
                            city: lead.city,
                            country: lead.country,
                            leadScore: lead.leadScore,
                            auditFinding: lead.auditFindings,
                            recommendedService: lead.recommendedService,
                          });
                        }}
                        className="rounded-[6px] bg-[#10B981] text-black font-semibold text-[11px] px-3 py-1 hover:bg-[#0EA5E9] transition-all"
                      >
                        Generate Pitch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UNIFIED LEAD DETAIL DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#121212] border-l border-[#2A2A2A] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-[8px] bg-[#1A1A1A] border border-[#2A2A2A] text-white font-bold text-sm">
                  {selectedLead.businessName.charAt(0)}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedLead.businessName}</h2>
                  <p className="text-xs text-[#888888]">{selectedLead.niche} &bull; {selectedLead.city}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-[#71717A] hover:text-white p-1 rounded"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPitchingLead({
                    id: selectedLead.id,
                    businessName: selectedLead.businessName,
                    email: selectedLead.email,
                    website: selectedLead.website,
                    niche: selectedLead.niche,
                    city: selectedLead.city,
                    country: selectedLead.country,
                    leadScore: selectedLead.leadScore,
                    auditFinding: selectedLead.auditFindings,
                    recommendedService: selectedLead.recommendedService,
                  });
                }}
                className="flex-1 rounded-[8px] bg-[#10B981] px-4 py-2 text-xs font-semibold text-black hover:bg-[#0EA5E9] transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="size-3.5" />
                <span>Generate AI Pitch</span>
              </button>

              <Link
                href="/meetings-setup"
                className="rounded-[8px] bg-[#1E1E1E] border border-[#333333] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#252525] flex items-center gap-1.5"
              >
                <CalendarCheck className="size-3.5 text-[#10B981]" />
                <span>Book Meet</span>
              </Link>
            </div>

            {/* Stage Selector */}
            <div className="rounded-[10px] bg-[#181818] border border-[#262626] p-3.5 space-y-2">
              <span className="text-[10px] text-[#71717A] uppercase font-mono font-bold block">
                Current Pipeline Stage
              </span>
              <select
                value={selectedLead.stage}
                onChange={(e) => handleStageChange(selectedLead.id, e.target.value as PipelineStage)}
                className="input bg-[#121212] border-[#262626] text-xs text-white"
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Section: Website Audit Findings */}
            <div className="rounded-[10px] bg-[#181818] border border-[#262626] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Globe className="size-3.5 text-[#38BDF8]" />
                  <span>Website Audit Evidence & Score</span>
                </h3>
                <span className="text-xs font-mono font-bold text-[#10B981]">
                  Score: {selectedLead.leadScore}/100
                </span>
              </div>

              <div className="p-3 rounded bg-[#121212] border border-[#202020] text-xs text-[#E4E4E7] leading-relaxed">
                {selectedLead.auditFindings}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#202020]">
                  <span className="text-[#71717A]">Official Website</span>
                  <a
                    href={selectedLead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>{selectedLead.website}</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#202020]">
                  <span className="text-[#71717A]">Contact Email</span>
                  <span className="text-white font-mono">{selectedLead.email || "Unavailable"}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[#71717A]">Recommended Pitch</span>
                  <span className="text-[#10B981] font-medium">{selectedLead.recommendedService}</span>
                </div>
              </div>
            </div>

            {/* Section: Matched Behance Case Study */}
            <div className="rounded-[10px] bg-[#181818] border border-[#262626] p-4 space-y-2.5">
              <span className="text-[10px] text-[#71717A] uppercase font-mono font-bold block">
                Matched Behance Proof
              </span>
              <p className="text-xs font-semibold text-white">{selectedLead.matchedBehanceTitle}</p>
              <a
                href={selectedLead.matchedBehanceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#10B981] hover:underline flex items-center gap-1 font-mono"
              >
                <span>{selectedLead.matchedBehanceUrl}</span>
                <ExternalLink className="size-2.5" />
              </a>
            </div>

            {/* Section: Activity Timeline */}
            <div className="rounded-[10px] bg-[#181818] border border-[#262626] p-4 space-y-3">
              <span className="text-[10px] text-[#71717A] uppercase font-mono font-bold block">
                Lead Activity Timeline
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#E4E4E7]">
                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                  <span>Lead discovered & verified from authorized data source</span>
                </div>
                <div className="flex items-center gap-2 text-[#E4E4E7]">
                  <span className="size-1.5 rounded-full bg-[#38BDF8]" />
                  <span>Website audit inspected layout, speed & call-to-actions</span>
                </div>
                <div className="flex items-center gap-2 text-[#E4E4E7]">
                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                  <span>Assigned qualification score: {selectedLead.leadScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Pitch Modal */}
      {pitchingLead && (
        <PitchModal
          lead={pitchingLead}
          onClose={() => setPitchingLead(null)}
          onSendSuccess={(msg) => {
            alert(msg);
            setPitchingLead(null);
          }}
        />
      )}
    </div>
  );
}
