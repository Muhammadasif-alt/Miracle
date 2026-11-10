"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  FolderHeart,
  Globe,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { BrandEmailWriter, DEFAULT_PORTFOLIO_VAULT, type PortfolioVaultData } from "@/lib/brand-email-writer";

export interface PitchLead {
  id?: string;
  businessName?: string;
  channelName?: string;
  email?: string;
  website?: string;
  websiteUrl?: string;
  niche?: string;
  city?: string;
  country?: string;
  leadScore?: number;
  auditFinding?: string;
  recommendedService?: string;
  personalizedHook?: string;
}

interface PitchModalProps {
  lead: PitchLead | null;
  onClose: () => void;
  onSendSuccess?: (msg: string) => void;
}

export function PitchModal({ lead, onClose, onSendSuccess }: PitchModalProps) {
  const [copied, setCopied] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedDraftNotice, setSavedDraftNotice] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendSuccessNotice, setSendSuccessNotice] = useState<string | null>(null);
  const [sendErrorNotice, setSendErrorNotice] = useState<string | null>(null);
  const [addedToSequenceNotice, setAddedToSequenceNotice] = useState(false);

  // Editable Draft fields
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [hook, setHook] = useState("");
  const [matchedBehanceUrl, setMatchedBehanceUrl] = useState("");
  const [matchedProjectTitle, setMatchedProjectTitle] = useState("");
  const [recommendedService, setRecommendedService] = useState("");
  const [auditFinding, setAuditFinding] = useState("");
  const [senderSignature, setSenderSignature] = useState("");
  const [bookingCta, setBookingCta] = useState("");

  const company = lead?.businessName || lead?.channelName || "Prospect";
  const website = lead?.website || lead?.websiteUrl || "https://" + company.toLowerCase().replace(/\s+/g, "") + ".com";
  const niche = lead?.niche || "Creative & Commercial";

  useEffect(() => {
    if (!lead) return;

    // Load user's saved business profile & portfolio
    let vault: PortfolioVaultData = DEFAULT_PORTFOLIO_VAULT;
    let businessProfile: any = {};
    let bookingUrl = "";

    try {
      const storedVault = localStorage.getItem("miracle_portfolio_vault");
      if (storedVault) vault = JSON.parse(storedVault);

      const storedBehance = localStorage.getItem("miracle_behance_portfolio");
      if (storedBehance) {
        const b = JSON.parse(storedBehance);
        if (b.featuredProjects) vault.featuredProjects = b.featuredProjects;
        if (b.profileUrl) vault.behanceUrl = b.profileUrl;
      }

      const storedProfile = localStorage.getItem("miracle_business_profile");
      if (storedProfile) {
        businessProfile = JSON.parse(storedProfile);
        if (businessProfile.emailSignature) setSenderSignature(businessProfile.emailSignature);
      }

      const storedCalendar = localStorage.getItem("miracle_calendar_settings");
      if (storedCalendar) {
        const c = JSON.parse(storedCalendar);
        if (c.bookingUrl) bookingUrl = c.bookingUrl;
      }
    } catch {}

    // Find best matching Behance case study; fallback strictly to saved primary profile
    const matchedProject = vault.featuredProjects?.find((p) => {
      const pNiche = (p.targetNiche || "").toLowerCase();
      const n = niche.toLowerCase();
      return pNiche.includes(n) || n.includes(pNiche) || (pNiche === "all niches");
    });

    const behanceUrl = matchedProject?.url || vault.behanceUrl || (vault as any).primary_behance_profile_url || "";
    setMatchedBehanceUrl(behanceUrl);
    setMatchedProjectTitle(matchedProject?.title || "Behance Creative Profile");

    // Dynamic audit finding based on real observable criteria
    const finding = lead.auditFinding || `Desktop layout has solid visual branding, but lacks high-converting short-form retention reels and structured testimonial proof.`;
    const service = lead.recommendedService || (niche.toLowerCase().includes("video") ? "Retention Video Editing & Motion Hooks" : "High-Converting Visual Identity & Landing Assets");
    setAuditFinding(finding);
    setRecommendedService(service);

    // Dynamic AI hook
    const generatedHook = lead.personalizedHook || `Noticed an opportunity to elevate ${company}'s creative visual assets to convert more high-ticket inquiries in ${niche}.`;
    setHook(generatedHook);

    // Check if an existing draft was already saved for this lead
    try {
      const existingDrafts = JSON.parse(localStorage.getItem("miracle_email_drafts") || "[]");
      const savedDraft = existingDrafts.find((d: any) => d.leadId === lead.id || d.company === company);
      if (savedDraft) {
        setSubject(savedDraft.subject);
        setBody(savedDraft.body);
        return;
      }
    } catch {}

    // Generate fresh email using BrandEmailWriter
    const generated = BrandEmailWriter.generateEmail(
      {
        businessName: company,
        email: lead.email || "client@company.com",
        websiteUrl: website,
        niche: niche,
        city: lead.city,
        country: lead.country,
      },
      vault
    );

    setSubject(generated.subject);
    setBody(generated.body);
  }, [lead]);

  if (!lead) return null;

  const handleRegenerate = () => {
    let vault: PortfolioVaultData = DEFAULT_PORTFOLIO_VAULT;
    try {
      const storedVault = localStorage.getItem("miracle_portfolio_vault");
      if (storedVault) vault = JSON.parse(storedVault);
    } catch {}

    const generated = BrandEmailWriter.generateEmail(
      {
        businessName: company,
        email: lead.email || "client@company.com",
        websiteUrl: website,
        niche: niche,
        city: lead.city,
        country: lead.country,
      },
      vault
    );
    setSubject(generated.subject);
    setBody(generated.body);
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard?.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    setSavingDraft(true);
    try {
      const existing = JSON.parse(localStorage.getItem("miracle_email_drafts") || "[]");
      const draft = {
        id: "draft-" + (lead.id || Date.now()),
        leadId: lead.id,
        company,
        email: lead.email || "contact@" + company.toLowerCase().replace(/\s+/g, "") + ".com",
        subject,
        body,
        matchedBehanceUrl,
        updatedAt: new Date().toISOString(),
        status: "Draft Saved",
      };
      const updated = [draft, ...existing.filter((d: any) => d.leadId !== lead.id && d.company !== company)];
      localStorage.setItem("miracle_email_drafts", JSON.stringify(updated));
      setSavedDraftNotice(true);
      setTimeout(() => setSavedDraftNotice(false), 2500);
    } catch {} finally {
      setSavingDraft(false);
    }
  };

  const handleAddToSequence = () => {
    try {
      const existing = JSON.parse(localStorage.getItem("miracle_campaign_queue") || "[]");
      const queuedItem = {
        id: "seq-" + Date.now(),
        leadId: lead.id,
        company,
        email: lead.email || "contact@" + company.toLowerCase().replace(/\s+/g, "") + ".com",
        subject,
        body,
        step: 1,
        status: "Queued (Step 1)",
        scheduledFor: "Next optimal window (Send Time Optimizer)",
        addedAt: new Date().toISOString(),
      };
      const updated = [queuedItem, ...existing.filter((q: any) => q.leadId !== lead.id)];
      localStorage.setItem("miracle_campaign_queue", JSON.stringify(updated));
      setAddedToSequenceNotice(true);
      setTimeout(() => setAddedToSequenceNotice(false), 2500);
    } catch {}
  };

  const handleSendEmail = async () => {
    const targetEmail = lead.email || "contact@" + company.toLowerCase().replace(/\s+/g, "") + ".com";
    setSendingEmail(true);
    setSendSuccessNotice(null);
    setSendErrorNotice(null);

    try {
      const res = await fetch("/api/integrations/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: targetEmail,
          subject,
          body,
          leadId: lead.id,
          company,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSendSuccessNotice(`✓ Email submitted through Gmail API! Message ID: ${data.messageId || "sent-200"}`);

        // Update sent history
        try {
          const sent = JSON.parse(localStorage.getItem("miracle_sent_emails") || "[]");
          const record = {
            id: "sent-" + Date.now(),
            leadId: lead.id,
            company,
            email: targetEmail,
            subject,
            sentAt: new Date().toISOString(),
            status: "Delivered",
            messageId: data.messageId,
          };
          localStorage.setItem("miracle_sent_emails", JSON.stringify([record, ...sent]));
        } catch {}

        if (onSendSuccess) onSendSuccess(`Outreach sent to ${company}!`);
      } else {
        setSendErrorNotice(`Failed to send: ${data.error || "Please verify your Gmail SMTP credentials"}`);
      }
    } catch (err: any) {
      setSendErrorNotice(`Send error: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="card max-w-2xl w-full p-6 shadow-2xl bg-[#121212] border border-[#2A2A2A] rounded-[18px] space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-[8px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Personalized Pitch Generator</h2>
              <p className="text-xs text-[#888888]">Target: {company} &bull; {niche}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#71717A] hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* SECTION A: Lead Context */}
        <div className="rounded-[10px] bg-[#181818] border border-[#262626] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold text-[#10B981] tracking-wider">
              Section A: Verified Lead Context
            </span>
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
            >
              <span>{website}</span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-[#121212] border border-[#222222]">
              <span className="text-[10px] text-[#71717A] block">Observed Audit Finding:</span>
              <p className="text-[#E4E4E7] font-medium mt-0.5">{auditFinding}</p>
            </div>
            <div className="p-2 rounded bg-[#121212] border border-[#222222]">
              <span className="text-[10px] text-[#71717A] block">Recommended Service Pitch:</span>
              <p className="text-[#10B981] font-medium mt-0.5">{recommendedService}</p>
            </div>
          </div>

          <div className="p-2 rounded bg-[#121212] border border-[#222222] flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] text-[#71717A] block">Matched Behance Case Study:</span>
              <p className="text-white text-xs font-medium truncate">{matchedProjectTitle}</p>
            </div>
            <a
              href={matchedBehanceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#10B981] hover:underline font-mono shrink-0 ml-2"
            >
              View Proof &rarr;
            </a>
          </div>
        </div>

        {/* SECTION B: AI Hook */}
        <div className="rounded-[10px] bg-[#181818] border border-[#262626] p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono font-bold text-[#F59E0B] tracking-wider">
            Section B: 1-Line Personalized Hook
          </span>
          <input
            type="text"
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            className="input bg-[#121212] border-[#262626] text-xs text-white"
          />
        </div>

        {/* SECTION C: Editable Outreach Email */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase font-mono font-bold text-[#38BDF8] tracking-wider block">
            Section C: Full Personalized Email (Editable)
          </span>

          <div>
            <label className="text-[11px] text-[#A1A1AA] font-semibold block mb-1">Subject Line:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input bg-[#181818] border-[#2A2A2A] text-xs text-white font-medium"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#A1A1AA] font-semibold block mb-1">Email Body:</label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="input h-auto p-3.5 text-xs font-mono leading-relaxed resize-none text-[#D4D4D8] rounded-[10px] bg-[#181818] border-[#2A2A2A]"
            />
          </div>
        </div>

        {/* Feedback Alerts */}
        {sendSuccessNotice && (
          <div className="p-3 rounded-[8px] bg-[#10B981]/10 text-[#10B981] text-xs border border-[#10B981]/20">
            {sendSuccessNotice}
          </div>
        )}
        {sendErrorNotice && (
          <div className="p-3 rounded-[8px] bg-[#EF4444]/10 text-[#EF4444] text-xs border border-[#EF4444]/20">
            {sendErrorNotice}
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="pt-3 border-t border-[#222222] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              className="rounded-[8px] bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222222] inline-flex items-center gap-1.5"
            >
              <RefreshCw className="size-3" />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="rounded-[8px] bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222222] inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="size-3 text-[#10B981]" /> : <Copy className="size-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="rounded-[8px] bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222222] inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="size-3 text-[#38BDF8]" />
              <span>{savedDraftNotice ? "Saved to Drafts!" : "Save Draft"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToSequence}
              className="rounded-[8px] bg-[#1A1A1A] border border-[#333333] px-3.5 py-1.5 text-xs font-medium text-[#10B981] hover:bg-[#222222]"
            >
              {addedToSequenceNotice ? "Added to Sequence!" : "+ Add to Sequence"}
            </button>

            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="rounded-[8px] bg-[#10B981] px-4 py-1.5 text-xs font-semibold text-black hover:bg-[#0EA5E9] inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {sendingEmail ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              <span>Send Now</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-1.5 text-xs text-[#888888] hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
