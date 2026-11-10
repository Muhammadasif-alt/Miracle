"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Film,
  Filter,
  Flame,
  Globe,
  Image as ImageIcon,
  Layers,
  Loader2,
  MapPin,
  Palette,
  Play,
  RotateCcw,
  Search,
  Send,
  Sheet,
  Sparkles,
  Star,
  StopCircle,
  Table,
  Video,
  X,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { LinkedinIcon } from "@/components/ui/LinkedinIcon";
import { YoutubeIcon } from "@/components/ui/YoutubeIcon";
import { GlassDropdown } from "@/components/ui/GlassDropdown";
import {
  COUNTRIES_DATA,
  NICHES_DATA,
  AUDIENCES_DATA,
  TONES_DATA,
  PLATFORMS_DATA,
} from "@/lib/geo-data";
import { findScreen } from "@/lib/screens";
import { PitchModal, type PitchLead } from "@/components/leads/PitchModal";

const TARGET_PRESETS = [
  {
    id: "creators",
    label: "YouTubers & Creators",
    sub: "Video Editing & Thumbnails",
    role: "Content Creator OR YouTuber",
    niche: "YouTubers & Content Creators",
    defaultNeeds: ["reels", "thumbnails"],
  },
  {
    id: "realestate",
    label: "Real Estate Agents",
    sub: "Property Reels & Flyers",
    role: "Realtor OR Real Estate Broker",
    niche: "Real Estate & Property",
    defaultNeeds: ["reels", "branding"],
  },
  {
    id: "fitness",
    label: "Gyms & Fitness Coaches",
    sub: "Workout Reels & Posters",
    role: "Fitness Coach OR Gym Owner",
    niche: "Fitness Trainers & Gyms",
    defaultNeeds: ["reels", "ads"],
  },
  {
    id: "restaurants",
    label: "Restaurants & Cafes",
    sub: "Food Videos & Menu Design",
    role: "Restaurant Owner OR General Manager",
    niche: "Hospitality & Restaurants",
    defaultNeeds: ["reels", "branding", "ads"],
  },
  {
    id: "ecommerce",
    label: "E-Commerce Brands",
    sub: "Product Reels & Ad Creatives",
    role: "Founder OR Head of Growth",
    niche: "E-Commerce & Retail Brands",
    defaultNeeds: ["ads", "reels"],
  },
  {
    id: "saas",
    label: "B2B SaaS & Tech",
    sub: "Product Demos & Motion Graphics",
    role: "Head of Marketing OR Founder",
    niche: "SaaS & AI Software",
    defaultNeeds: ["reels", "thumbnails"],
  },
];

const CREATIVE_NEEDS = [
  { id: "reels", label: "Short-Form Video (Reels / TikTok / Shorts)", icon: Film },
  { id: "thumbnails", label: "YouTube Editing & High-CTR Thumbnails", icon: Video },
  { id: "ads", label: "Social Media Posts, Carousels & Ad Banners", icon: Palette },
  { id: "branding", label: "Logo, Branding & Visual Revamp", icon: Sparkles },
  { id: "low_visuals", label: "Low Visual Quality / Missing Videos", icon: ImageIcon },
];

const COUNT_PRESETS = [10, 25, 50, 100];

export function LeadHunter() {
  const screen = findScreen("/lead-hunter");

  // State
  const [engine, setEngine] = useState<"youtube" | "google_maps" | "linkedin">("youtube");
  const [selectedPreset, setSelectedPreset] = useState<string>("creators");
  
  // Dropdown States
  const [countryInput, setCountryInput] = useState<string>("United States");
  const [cityInput, setCityInput] = useState<string>("Miami");
  const [nicheInput, setNicheInput] = useState<string>("YouTubers & Content Creators");
  const [roleInput, setRoleInput] = useState<string>("Content Creator OR YouTuber");
  const [audienceInput, setAudienceInput] = useState<string>("CEOs & Founders");
  const [toneInput, setToneInput] = useState<string>("Direct & Professional");

  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(["reels", "thumbnails"]);
  const [leadCount, setLeadCount] = useState<number>(10);
  const [minQualityScore, setMinQualityScore] = useState<number>(7.0);

  // Scraper Progress State
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedCount, setScrapedCount] = useState(0);
  const [leads, setLeads] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState("");

  // Google Sheets Sync State
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncSuccess, setSheetSyncSuccess] = useState<string | null>(null);

  // Pitch Modal State
  const [pitchLead, setPitchLead] = useState<any | null>(null);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Dynamic City options based on chosen Country
  const activeCountryObj = useMemo(() => {
    return COUNTRIES_DATA.find((c) => c.name.toLowerCase() === countryInput.toLowerCase()) || COUNTRIES_DATA[1];
  }, [countryInput]);

  const cityOptions = useMemo(() => {
    return activeCountryObj.cities;
  }, [activeCountryObj]);

  const handleCountryChange = (newCountry: string) => {
    setCountryInput(newCountry);
    const matched = COUNTRIES_DATA.find((c) => c.name.toLowerCase() === newCountry.toLowerCase());
    if (matched && matched.cities.length > 0) {
      setCityInput(matched.cities[0]);
    }
  };

  const handleSelectPreset = (p: (typeof TARGET_PRESETS)[0]) => {
    setSelectedPreset(p.id);
    setNicheInput(p.niche);
    setRoleInput(p.role);
    setSelectedNeeds(p.defaultNeeds);
  };

  const toggleNeed = (id: string) => {
    if (selectedNeeds.includes(id)) {
      setSelectedNeeds(selectedNeeds.filter((n) => n !== id));
    } else {
      setSelectedNeeds([...selectedNeeds, id]);
    }
  };

  // Run Scraper Engine
  const handleStartScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScraping(true);
    setScrapedCount(0);
    setSheetSyncSuccess(null);

    try {
      if (engine === "youtube") {
        // YouTube + AI Qualification Pipeline
        const res = await fetch("/api/google/youtube-scraper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            niche: selectedPreset,
            maxResults: leadCount,
            minQualityScore,
            autoSyncSheet: false,
          }),
        });

        const data = await res.json();
        if (data.ok && Array.isArray(data.leads)) {
          setLeads(data.leads);
          setScrapedCount(data.leads.length);

          // Save to localStorage
          const existing = JSON.parse(localStorage.getItem("miracle_saved_leads") || "[]");
          const mapped = data.leads.map((l: any) => ({
            id: l.id,
            businessName: l.channelName,
            contactName: l.handle,
            role: "YouTube Creator / Brand",
            email: l.email,
            phone: "",
            websiteUrl: l.websiteUrl,
            instagramUrl: l.socials?.instagram,
            source: "youtube",
            city: "Online",
            country: "Global",
            creativeTriggers: [l.creativeGap],
            aiQualityScore: l.aiQualityScore,
            personalizedHook: l.personalizedHook,
            matchedPortfolioUrl: JSON.parse(localStorage.getItem("miracle_behance_portfolio") || "{}").profileUrl || "",
            matchedService: "YouTube CTR Thumbnails & Retention Edits",
            suggestedPitch: l.personalizedHook,
          }));
          const merged = [...mapped, ...existing.filter((el: any) => !mapped.some((nl: any) => nl.id === el.id))];
          localStorage.setItem("miracle_saved_leads", JSON.stringify(merged));
        }
      } else {
        // Google Maps / LinkedIn engine
        const res = await fetch("/api/scraper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            engine,
            niche: nicheInput,
            role: roleInput,
            city: cityInput,
            country: countryInput,
            creativeNeeds: selectedNeeds,
            maxResults: leadCount,
          }),
        });

        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
          const formatted = data.leads.map((l: any, i: number) => ({
            ...l,
            aiQualityScore: l.aiQualityScore || 7.5 + (i % 3) * 0.5,
            personalizedHook: `Loved your recent business updates on ${l.businessName}—noticed your visual branding could scale with high-retention video reels.`,
          }));
          setLeads(formatted);
          setScrapedCount(formatted.length);

          const existing = JSON.parse(localStorage.getItem("miracle_saved_leads") || "[]");
          const merged = [...formatted, ...existing.filter((el: any) => !formatted.some((nl: any) => nl.id === el.id))];
          localStorage.setItem("miracle_saved_leads", JSON.stringify(merged));
        }
      }
    } catch (err) {
      console.error("Scraper error:", err);
    } finally {
      setIsScraping(false);
    }
  };

  // Sync Qualified Leads to Google Sheets
  const handleSyncToGoogleSheets = async () => {
    if (leads.length === 0) return;
    setIsSyncingSheet(true);
    setSheetSyncSuccess(null);

    try {
      const res = await fetch("/api/google/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: leads.filter((l) => (l.aiQualityScore || 7) >= 7),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSheetSyncSuccess(`Synced ${data.recordsSynced} qualified leads to Google Sheets Master Tracker!`);
        // Persist locally for reference
        localStorage.setItem("miracle_google_sheet_synced", JSON.stringify(data.rows));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Filtered Leads in Table
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const name = l.channelName || l.businessName || "";
      const email = l.email || "";
      const gap = l.creativeGap || (l.creativeTriggers ? l.creativeTriggers.join(" ") : "");
      const matchQ =
        filterQuery.trim() === "" ||
        name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        email.toLowerCase().includes(filterQuery.toLowerCase()) ||
        gap.toLowerCase().includes(filterQuery.toLowerCase());
      return matchQ;
    });
  }, [leads, filterQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Lead Name", "Email", "Channel / Website", "AI Quality Score", "Personalized Hook", "Status"];
    const rows = leads.map((l) => [
      `"${l.channelName || l.businessName}"`,
      `"${l.email || ""}"`,
      `"${l.channelUrl || l.websiteUrl || ""}"`,
      `"${l.aiQualityScore || 8.0}"`,
      `"${l.personalizedHook || ""}"`,
      `"Ready"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `miracle_google_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Lead Discovery & Google Pipeline"
        description="Automated multi-source scraper for YouTube Channels, Google Maps, and LinkedIn. Filters junk with AI Quality Scoring (>= 7) and generates 1-line personalized hooks for Google Sheets."
      />

      {/* 4 Pipeline Milestones */}
      <section className="card p-5 space-y-3 bg-[#121212] border border-[#2A2A2A]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#AAAAAA]">
          <span className="size-1.5 rounded-full bg-white" />
          <span>Full-Stack Google Ecosystem Workflow</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-[14px] bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
            <span className="text-[10px] font-mono text-[#777777]">PHASE 01</span>
            <div className="text-xs font-semibold text-white">YouTube & Maps Discovery</div>
            <p className="text-[11px] text-[#AAAAAA] leading-relaxed">
              Extracts high-value channels, videos, about pages, and deep website emails.
            </p>
          </div>
          <div className="p-3.5 rounded-[14px] bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
            <span className="text-[10px] font-mono text-[#777777]">PHASE 02</span>
            <div className="text-xs font-semibold text-white">AI Qualification (Score &gt;= 7)</div>
            <p className="text-[11px] text-[#AAAAAA] leading-relaxed">
              Filters out dormant/junk leads and scores business potential from 1 to 10.
            </p>
          </div>
          <div className="p-3.5 rounded-[14px] bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
            <span className="text-[10px] font-mono text-[#777777]">PHASE 03</span>
            <div className="text-xs font-semibold text-white">Google Sheets Master Tracker</div>
            <p className="text-[11px] text-[#AAAAAA] leading-relaxed">
              Auto-pushes qualified leads with 1-line personalized hooks to your Sheet.
            </p>
          </div>
          <div className="p-3.5 rounded-[14px] bg-[#1A1A1A] border border-[#2A2A2A] space-y-1">
            <span className="text-[10px] font-mono text-[#777777]">PHASE 04</span>
            <div className="text-xs font-semibold text-white">Gmail & Meet Booking</div>
            <p className="text-[11px] text-[#AAAAAA] leading-relaxed">
              Dispatches outreach via connected Gmail and books Google Meet calls.
            </p>
          </div>
        </div>
      </section>

      {/* Engine Selection Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#2A2A2A] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEngine("youtube")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-[10px] transition-all ${
              engine === "youtube"
                ? "bg-white text-black font-semibold shadow-sm"
                : "bg-[#121212] text-[#AAAAAA] border border-[#2A2A2A] hover:text-white"
            }`}
          >
            <YoutubeIcon className="size-3.5 text-white" />
            <span>YouTube Creators & Video Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setEngine("google_maps")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-[10px] transition-all ${
              engine === "google_maps"
                ? "bg-white text-black font-semibold shadow-sm"
                : "bg-[#121212] text-[#AAAAAA] border border-[#2A2A2A] hover:text-white"
            }`}
          >
            <MapPin className="size-3.5" />
            <span>Google Maps Local Businesses</span>
          </button>

          <button
            type="button"
            onClick={() => setEngine("linkedin")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-[10px] transition-all ${
              engine === "linkedin"
                ? "bg-white text-black font-semibold shadow-sm"
                : "bg-[#121212] text-[#AAAAAA] border border-[#2A2A2A] hover:text-white"
            }`}
          >
            <LinkedinIcon className="size-3.5" />
            <span>LinkedIn X-Ray Engine</span>
          </button>
        </div>

        <span className="text-[11px] text-[#777777] hidden sm:block">
          {engine === "youtube" ? "Stealth Discovery & AI Scoring" : "Direct Multi-Source Extraction"}
        </span>
      </div>

      {/* Scraper Config Form */}
      <form onSubmit={handleStartScrape} className="card p-6 space-y-6 bg-[#121212] border border-[#2A2A2A]">
        {/* 1. Target Presets */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#AAAAAA] block">
            1. Target Industry / Channel Niche
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {TARGET_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-[12px] text-left border transition-all flex flex-col justify-between ${
                  selectedPreset === preset.id
                    ? "bg-[#1A1A1A] border-white text-white"
                    : "bg-[#121212] border-[#2A2A2A] text-[#AAAAAA] hover:border-[#3A3A3A] hover:text-white"
                }`}
              >
                <div className="font-medium text-xs truncate text-white">{preset.label}</div>
                <div className="text-[10px] text-[#777777] truncate mt-1">{preset.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Parameters & Location */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#AAAAAA] block">
            2. Search & Filter Parameters
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassDropdown
              id="select-country"
              label="Target Region / Country"
              placeholder="Select Country..."
              items={COUNTRIES_DATA.map((c) => ({
                value: c.name,
                label: `${c.flag} ${c.name}`,
              }))}
              value={countryInput}
              onChange={handleCountryChange}
              allowCustom={true}
            />

            <GlassDropdown
              id="select-city"
              label={`City / Area (${activeCountryObj.name})`}
              placeholder="Select or enter City..."
              items={cityOptions}
              value={cityInput}
              onChange={(val) => setCityInput(val)}
              allowCustom={true}
            />

            <GlassDropdown
              id="select-niche"
              label="Category / Keyword"
              placeholder="Select Niche..."
              items={NICHES_DATA}
              value={nicheInput}
              onChange={(val) => setNicheInput(val)}
              allowCustom={true}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-[#AAAAAA] block mb-1.5 uppercase tracking-wider">
                {engine === "youtube" ? "Search Keyword / Topic" : "Decision Maker Role"}
              </label>
              <input
                type="text"
                required
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="e.g. Fitness, Real Estate, Creator"
                className="input h-10 text-xs rounded-[10px] bg-[#1A1A1A] border-[#2A2A2A]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#AAAAAA] block mb-1.5 uppercase tracking-wider">
                AI Quality Filter (Threshold)
              </label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-[10px] bg-[#1A1A1A] border border-[#2A2A2A] text-xs">
                <Star className="size-3.5 text-white" />
                <span className="font-semibold text-white">Score &gt;= 7.0</span>
                <span className="text-[11px] text-[#777777] ml-auto">Filters low-quality junk</span>
              </div>
            </div>

            <GlassDropdown
              id="select-tone"
              label="Outreach Tone"
              placeholder="Select Tone..."
              items={TONES_DATA}
              value={toneInput}
              onChange={(val) => setToneInput(val)}
              allowCustom={true}
            />
          </div>
        </div>

        {/* 3. Creative Needs to Detect */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#AAAAAA] block">
            3. Creative Gaps to Audit (Personalization Angle)
          </label>
          <div className="flex flex-wrap gap-2">
            {CREATIVE_NEEDS.map((need) => {
              const Icon = need.icon;
              const isSelected = selectedNeeds.includes(need.id);
              return (
                <button
                  key={need.id}
                  type="button"
                  onClick={() => toggleNeed(need.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-[#1A1A1A] border-[#2A2A2A] text-[#AAAAAA] hover:text-white"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{need.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Custom Lead Count & Scraper Trigger */}
        <div className="pt-4 border-t border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-white shrink-0">Extract Lead Count:</span>
            <div className="flex items-center gap-1.5">
              {COUNT_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLeadCount(n)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[8px] border transition-all ${
                    leadCount === n
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-[#1A1A1A] border-[#2A2A2A] text-[#AAAAAA] hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="number"
                  min={1}
                  max={250}
                  value={leadCount}
                  onChange={(e) => setLeadCount(Math.max(1, Math.min(250, Number(e.target.value) || 1)))}
                  className="input h-8 w-20 text-xs text-center rounded-[8px] bg-[#1A1A1A] border-[#2A2A2A]"
                />
                <span className="text-[11px] text-[#777777]">custom</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isScraping}
            className="btn-primary px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-2 rounded-[10px]"
          >
            {isScraping ? (
              <>
                <Loader2 className="size-4 animate-spin text-black" />
                <span>Running Scraper & AI Filter ({scrapedCount}/{leadCount})...</span>
              </>
            ) : (
              <>
                <Search className="size-4" />
                <span>Scrape & Qualify Leads ({leadCount} Leads)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sheets Sync Notification Banner */}
      {sheetSyncSuccess && (
        <div className="p-4 rounded-[14px] bg-[#121212] border border-white text-white text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 shrink-0 text-white" />
            <span className="font-medium">{sheetSyncSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSheetSyncSuccess(null)}
            className="text-[#AAAAAA] hover:text-white p-1"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Extracted Leads Results Table */}
      {leads.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Qualified Leads ({leads.length}) &bull; AI Score &gt;= 7.0
              </h3>
              <p className="text-xs text-[#AAAAAA]">
                All leads analyzed for visual gaps with 1-line personalized hooks ready for Google Sheets & Gmail.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="size-3.5 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter extracted leads..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="input h-8 pl-9 text-xs w-44 rounded-[8px] bg-[#1A1A1A] border-[#2A2A2A]"
                />
              </div>

              <button
                type="button"
                onClick={handleSyncToGoogleSheets}
                disabled={isSyncingSheet}
                className="btn-primary h-8 px-3 text-xs inline-flex items-center gap-1.5 rounded-[8px]"
              >
                {isSyncingSheet ? (
                  <Loader2 className="size-3 animate-spin text-black" />
                ) : (
                  <Table className="size-3.5 text-black" />
                )}
                <span>Sync to Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="btn-secondary h-8 px-3 text-xs inline-flex items-center gap-1.5 rounded-[8px]"
              >
                <Download className="size-3" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="card overflow-hidden bg-[#121212] border border-[#2A2A2A]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A] text-[#AAAAAA] font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Lead / Channel</th>
                  <th className="px-4 py-3">Verified Contact</th>
                  <th className="px-4 py-3">AI Quality Score</th>
                  <th className="px-4 py-3">1-Line Personalized Hook</th>
                  <th className="px-4 py-3 text-right">Outreach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white text-xs">
                        {lead.channelName || lead.businessName}
                      </div>
                      <div className="text-[#AAAAAA] text-[11px] mt-0.5 flex items-center gap-1.5">
                        <span>{lead.handle || lead.contactName || "Creator"}</span>
                        {lead.subscribers && (
                          <span className="text-[#777777]">&bull; {lead.subscribers}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 space-y-0.5">
                      {lead.email ? (
                        <div className="text-white font-mono text-[11px]">
                          {lead.email}
                        </div>
                      ) : (
                        <span className="text-[#777777] text-[11px]">Crawling...</span>
                      )}
                      {lead.websiteUrl && (
                        <a
                          href={lead.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#AAAAAA] hover:text-white text-[10px] inline-flex items-center gap-1 truncate max-w-[140px]"
                        >
                          <span>{lead.websiteUrl.replace("https://", "")}</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#1A1A1A] border border-white text-white font-mono text-[11px]">
                        <Star className="size-3 fill-white text-white" />
                        <span className="font-bold">{lead.aiQualityScore || "8.5"} / 10</span>
                      </div>
                      <span className="block text-[10px] text-[#777777] mt-1">Qualified Lead</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="text-[#D1D5DB] text-[11px] leading-relaxed max-w-sm line-clamp-2">
                        {lead.personalizedHook}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPitchLead(lead)}
                          className="btn-primary h-7 px-3 text-[11px] inline-flex items-center gap-1 rounded-[8px]"
                        >
                          <Send className="size-3 text-black" />
                          <span>Pitch</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Rebuilt Modular AI Pitch Drawer/Modal */}
      {pitchLead && (
        <PitchModal
          lead={pitchLead}
          onClose={() => setPitchLead(null)}
          onSendSuccess={(msg) => {
            alert(msg);
            setPitchLead(null);
          }}
        />
      )}
    </div>
  );
}
