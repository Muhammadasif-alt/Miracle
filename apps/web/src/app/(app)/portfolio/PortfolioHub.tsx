"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FolderHeart,
  Globe,
  Palette,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";

export interface BehanceProject {
  id: string;
  title: string;
  url: string;
  category: "Graphic Design & Branding" | "Video Editing & Showreels" | "Thumbnails & CTR" | "3D Motion";
  targetNiche: "Real Estate" | "YouTubers & Creators" | "Fitness Coaches" | "Dental & Clinics" | "E-Commerce" | "All Niches";
  description?: string;
  featured?: boolean;
}

const DEFAULT_PROJECTS: BehanceProject[] = [];

export function PortfolioHub() {
  const [behanceUrl, setBehanceUrl] = useState("https://www.behance.net/zohaibahamd");
  const [studioName, setStudioName] = useState("Miracle Creative Studio");
  const [coreServices, setCoreServices] = useState("Graphic Design, Brand Identity & High-Converting Video Editing");
  const [projects, setProjects] = useState<BehanceProject[]>(DEFAULT_PROJECTS);

  // New project form state
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState<BehanceProject["category"]>("Graphic Design & Branding");
  const [newNiche, setNewNiche] = useState<BehanceProject["targetNiche"]>("All Niches");
  const [newDesc, setNewDesc] = useState("");

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    // 1. Fetch server-side Behance vault
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.settings?.behance) {
          const b = data.settings.behance;
          if (b.profileUrl || b.primary_behance_profile_url) {
            setBehanceUrl(b.profileUrl || b.primary_behance_profile_url);
          }
          if (b.featuredProjects && Array.isArray(b.featuredProjects)) {
            setProjects(b.featuredProjects);
          }
        }
      })
      .catch(() => {});

    try {
      const stored = localStorage.getItem("miracle_behance_portfolio");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profileUrl || parsed.behanceUrl) setBehanceUrl(parsed.profileUrl || parsed.behanceUrl);
        if (parsed.studioName) setStudioName(parsed.studioName);
        if (parsed.coreServices) setCoreServices(parsed.coreServices);
        if (parsed.featuredProjects && Array.isArray(parsed.featuredProjects)) {
          setProjects(parsed.featuredProjects);
        }
      }
    } catch (e) {
      console.warn("Failed to load portfolio:", e);
    }
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanProfileUrl = behanceUrl.trim();

    const payload = {
      profileUrl: cleanProfileUrl,
      behanceUrl: cleanProfileUrl,
      studioName: studioName.trim(),
      coreServices: coreServices.trim(),
      featuredProjects: projects,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("miracle_behance_portfolio", JSON.stringify(payload));

    // Update global vault for outreach engine
    localStorage.setItem(
      "miracle_portfolio_vault",
      JSON.stringify({
        primaryPortfolioUrl: cleanProfileUrl,
        behanceUrl: cleanProfileUrl,
        servicesOffered: coreServices.trim(),
        calendarBookingUrl: "",
        featuredProjects: projects,
      })
    );

    // Sync to backend BehanceVault
    const cleanUrl = behanceUrl.trim();
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        behance: {
          profileUrl: cleanUrl,
          primary_behance_profile_url: cleanUrl,
          featuredProjects: projects,
        },
        businessProfile: {
          businessName: studioName.trim(),
          servicesOffered: coreServices.trim(),
          website: cleanUrl,
        },
      }),
    }).catch(() => {});

    window.dispatchEvent(new Event("miracle_portfolio_updated"));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let validUrl = newUrl.trim();
    if (!validUrl.startsWith("http")) validUrl = "https://" + validUrl;

    const newProj: BehanceProject = {
      id: "beh-" + Date.now(),
      title: newTitle.trim(),
      url: validUrl,
      category: newCategory,
      targetNiche: newNiche,
      description: newDesc.trim(),
      featured: true,
    };

    const updated = [newProj, ...projects];
    setProjects(updated);
    setNewTitle("");
    setNewUrl("");
    setNewDesc("");

    // Auto-persist
    const payload = {
      profileUrl: behanceUrl.trim(),
      studioName: studioName.trim(),
      coreServices: coreServices.trim(),
      featuredProjects: updated,
    };
    localStorage.setItem("miracle_behance_portfolio", JSON.stringify(payload));
    // Sync to backend BehanceVault
    const cleanUrl = behanceUrl.trim();
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        behance: {
          profileUrl: cleanUrl,
          primary_behance_profile_url: cleanUrl,
          featuredProjects: projects,
        },
        businessProfile: {
          businessName: studioName.trim(),
          servicesOffered: coreServices.trim(),
          website: cleanUrl,
        },
      }),
    }).catch(() => {});

    window.dispatchEvent(new Event("miracle_portfolio_updated"));
  };

  const handleRemoveProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    const payload = {
      profileUrl: behanceUrl.trim(),
      studioName: studioName.trim(),
      coreServices: coreServices.trim(),
      featuredProjects: updated,
    };
    localStorage.setItem("miracle_behance_portfolio", JSON.stringify(payload));
    // Sync to backend BehanceVault
    const cleanUrl = behanceUrl.trim();
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        behance: {
          profileUrl: cleanUrl,
          primary_behance_profile_url: cleanUrl,
          featuredProjects: projects,
        },
        businessProfile: {
          businessName: studioName.trim(),
          servicesOffered: coreServices.trim(),
          website: cleanUrl,
        },
      }),
    }).catch(() => {});

    window.dispatchEvent(new Event("miracle_portfolio_updated"));
  };

  const handleToggleFeatured = (id: string) => {
    const updated = projects.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p));
    setProjects(updated);
    const payload = {
      profileUrl: behanceUrl.trim(),
      studioName: studioName.trim(),
      coreServices: coreServices.trim(),
      featuredProjects: updated,
    };
    localStorage.setItem("miracle_behance_portfolio", JSON.stringify(payload));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <PageHeader
            title="My Behance Portfolio"
            description="Manage your verified Behance portfolio and project case studies. Automatically matched to prospect niches in outreach pitches."
          />
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          className="inline-flex items-center gap-2 rounded-[8px] bg-[#10B981] px-4 py-2.5 text-xs font-semibold text-black transition-all hover:bg-[#0EA5E9] shadow-sm"
        >
          {savedNotice ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
          <span>{savedNotice ? "Portfolio Saved!" : "Save All Changes"}</span>
        </button>
      </div>

      {/* Primary Behance Profile Setup Card */}
      <div className="rounded-[14px] border border-[#222222] bg-[#121212] p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#222222] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[10px] bg-white text-black font-black text-sm">
              Bē
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">Single Behance Portfolio Setup</h2>
              <p className="text-xs text-[#888888]">Exclusive client proof source for all generated cold emails.</p>
            </div>
          </div>

          <span className="rounded-full bg-[#10B981]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#10B981] border border-[#10B981]/20 flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> Behance Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#CCCCCC]">My Main Behance Profile URL</label>
            <div className="relative mt-1.5">
              <input
                type="url"
                value={behanceUrl}
                onChange={(e) => setBehanceUrl(e.target.value)}
                placeholder="https://www.behance.net/your-agency"
                className="input bg-[#181818] border-[#2A2A2A] text-white text-xs pr-10"
              />
              <a
                href={behanceUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#10B981]"
                title="Preview Behance"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#CCCCCC]">Creative Studio / Brand Name</label>
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="Miracle Creative Studio"
              className="input mt-1.5 bg-[#181818] border-[#2A2A2A] text-white text-xs"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#CCCCCC]">Primary Services Offered</label>
          <input
            type="text"
            value={coreServices}
            onChange={(e) => setCoreServices(e.target.value)}
            className="input mt-1.5 bg-[#181818] border-[#2A2A2A] text-white text-xs"
          />
        </div>
      </div>

      {/* Add New Case Study Form */}
      <form onSubmit={handleAddProject} className="rounded-[14px] border border-[#222222] bg-[#121212] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="size-4 text-[#10B981]" />
            <span>Add Specific Behance Case Study</span>
          </h2>
          <span className="text-[11px] text-[#888888]">Matched to prospects by niche in email outreach</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#CCCCCC]">Project Title</label>
            <input
              type="text"
              placeholder="e.g. Modern Dental Clinic Rebrand & Signage"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="input mt-1.5 bg-[#181818] border-[#2A2A2A] text-white text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#CCCCCC]">Behance Project URL</label>
            <input
              type="url"
              placeholder="https://www.behance.net/gallery/..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="input mt-1.5 bg-[#181818] border-[#2A2A2A] text-white text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#CCCCCC]">Work Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="input mt-1.5 bg-[#181818] border-[#2A2A2A] text-white text-xs"
            >
              <option value="Graphic Design & Branding">Graphic Design & Branding</option>
              <option value="Video Editing & Showreels">Video Editing & Showreels</option>
              <option value="Thumbnails & CTR">Thumbnails & CTR</option>
              <option value="3D Motion">3D Motion</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#CCCCCC]">Best Matching Prospect Niche</label>
            <select
              value={newNiche}
              onChange={(e) => setNewNiche(e.target.value as any)}
              className="input mt-1.5 bg-[#181818] border-[#2A2A2A] text-white text-xs"
            >
              <option value="All Niches">All Niches (Universal)</option>
              <option value="Real Estate">Real Estate Agents & Luxury Brokers</option>
              <option value="YouTubers & Creators">YouTubers & Content Creators</option>
              <option value="Dental & Clinics">Dental Clinics & Medical Aesthetics</option>
              <option value="Fitness Coaches">Fitness Coaches & Gyms</option>
              <option value="E-Commerce">E-Commerce & DTC Brands</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#CCCCCC]">Brief Project Context (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Generated +45% booking conversion through refined luxury visual identity"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="input mt-1.5 bg-[#181818] border-[#2A2A2A] text-white text-xs"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="rounded-[8px] bg-[#1E1E1E] border border-[#333333] px-4 py-2 text-xs font-semibold text-white hover:bg-[#252525] transition-all"
          >
            + Add Case Study to Vault
          </button>
        </div>
      </form>

      {/* Case Studies List */}
      <div className="rounded-[14px] border border-[#222222] bg-[#121212] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Configured Behance Projects ({projects.length})</h2>
            <p className="text-xs text-[#888888]">These exact URLs will be referenced in your outreach emails based on prospect industry.</p>
          </div>
        </div>

        <div className="divide-y divide-[#222222]">
          {projects.map((proj) => (
            <div key={proj.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white truncate">{proj.title}</p>
                  {proj.featured && (
                    <span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[9px] font-medium text-[#10B981] border border-[#10B981]/20">
                      Featured
                    </span>
                  )}
                </div>

                <a
                  href={proj.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#10B981] hover:underline flex items-center gap-1 font-mono truncate"
                >
                  <span>{proj.url}</span>
                  <ExternalLink className="size-2.5" />
                </a>

                {proj.description && (
                  <p className="text-[11px] text-[#71717A] italic">{proj.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[#A1A1AA] bg-[#181818] border border-[#282828] px-2.5 py-1 rounded-[6px]">
                  {proj.targetNiche}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleFeatured(proj.id)}
                  className={`p-1.5 rounded-[6px] border ${proj.featured ? "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10" : "text-[#71717A] border-[#2A2A2A] hover:text-white"}`}
                  title="Toggle Featured"
                >
                  <Star className="size-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveProject(proj.id)}
                  className="p-1.5 rounded-[6px] border border-[#2A2A2A] text-[#71717A] hover:text-[#EF4444] hover:border-[#EF4444]/30"
                  title="Remove Project"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
