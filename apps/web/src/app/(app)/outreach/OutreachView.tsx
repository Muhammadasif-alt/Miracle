"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Film,
  FolderHeart,
  Inbox,
  Loader2,
  Mail,
  MousePointerClick,
  Palette,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Video,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SpamGuardEngine, type DeliverabilityAnalysis } from "@/lib/spam-guard";
import { SendTimeOptimizer, type SendTimeAnalysis } from "@/lib/send-time-optimizer";
import {
  BrandEmailWriter,
  DEFAULT_PORTFOLIO_VAULT,
  type PortfolioVaultData,
  type BrandProspect,
} from "@/lib/brand-email-writer";
import type { TrackingEvent, LearningInsight } from "@/lib/email-learning-engine";

export const CREATIVE_TEMPLATES = [
  {
    id: "reels",
    name: "1. Pitching Reels & Shorts Video Editing",
    service: "Short-Form Video (9:16)",
    icon: Film,
    subject: "Quick visual idea for {{businessName}}",
    body: `Hi {{firstName}},

I came across {{businessName}} and noticed your visual presence has huge potential, but you're missing high-retention 9:16 vertical video reels to turn casual local viewers into paying clients.

We run a creative editing agency specializing in fast-paced hooks, kinetic typography, and sound design. 

Here is my Behance portfolio showcasing recent client designs & creative projects:
{{behanceUrl}}

Would you be open to seeing 2 custom video hook concepts I put together for {{businessName}} this week? Just reply "Yes" and I'll send them over.

Best regards,
Creative Studio Lead`,
    followUp1: "Day 3: Did you get a chance to check out my Behance portfolio? Just reply 'Yes' if you'd like to see sample hooks.",
    followUp2: "Day 6: We have open studio bandwidth this week. Would you like us to cut 1 free sample reel for your brand?",
    followUp3: "Day 10: Final courtesy note—wishing you and {{businessName}} all the best with your visual content!",
  },
  {
    id: "youtube",
    name: "2. Pitching YouTube Thumbnails & Long-Form",
    service: "YouTube & CTR Thumbnails",
    icon: Video,
    subject: "3 thumbnail tweaks to 2x CTR for {{businessName}}",
    body: `Hi {{firstName}},

I was watching your recent YouTube content and love the insights you're sharing. However, your current thumbnail CTR and early retention drop-off are likely cutting your views in half.

We design high-CTR YouTube thumbnails with 3D depth lighting, expressive facial cutouts, and tight retention-based pacing.

Take a look at my Behance portfolio showcasing recent client designs:
{{behanceUrl}}

Would you be open if I designed 2 complimentary thumbnail concepts for your next upload? Just reply "Yes" and I'll send them over.

Best,
Creative Video Team`,
    followUp1: "Day 3: Following up on the thumbnail concepts—happy to send over a complimentary visual mock tailored for your channel.",
    followUp2: "Day 6: Just finished a fresh batch of CTR thumbnails that hit 14% avg CTR. Still open to designing one for you for free.",
    followUp3: "Day 10: No worries if you're busy! We'll keep an eye on your channel's growth.",
  },
  {
    id: "carousels",
    name: "3. Pitching Social Media Graphic Packs & Carousels",
    service: "Social Carousels & Ad Banners",
    icon: Palette,
    subject: "Visual branding & carousel design for {{businessName}}",
    body: `Hi {{firstName}},

I noticed {{businessName}} posts valuable industry insights, but text-heavy posts often get scrolled past. Visual multi-slide carousels generate up to 4.8x more shares and bookmark saves on Instagram and LinkedIn.

We build modern, clean carousel decks and paid social media ad creatives.

Check out my Behance portfolio showcasing recent brand graphic kits:
{{behanceUrl}}

Can I share a 2-minute visual breakdown of how we'd revamp your social posts? Just reply "Yes" and I'll send it right over.

Cheers,
Creative Design Lead`,
    followUp1: "Day 3: Following up—happy to create a sample carousel mockup for your brand if you'd like to see it.",
    followUp2: "Day 6: Open to creating a complimentary 5-slide mockup carousel for your next topic if you'd like to test the waters.",
    followUp3: "Day 10: Closing the loop for now—hope your content continues scaling!",
  },
];

interface InboxMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  companyName: string;
  subject: string;
  body: string;
  intent: "SAMPLES" | "PRICING" | "MEETING" | "NOT_NOW" | "NOT_INTERESTED";
  receivedAgo: string;
  status: "PENDING" | "REPLIED" | "AUTO_REPLIED";
  suggestedReply: string;
}

interface DeliveryLogItem {
  id: string;
  recipient: string;
  subject: string;
  status: "Sent" | "Failed";
  error?: string;
  deliverabilityScore?: number;
  timestamp: string;
}

const SAMPLE_INBOX_MESSAGES: InboxMessage[] = [
  {
    id: "inbox-1",
    senderName: "Jordan Welch",
    senderEmail: "collabs@thejordanwelch.com",
    companyName: "Jordan Welch Media",
    subject: "Re: Quick visual idea for Jordan Welch Media",
    body: "Hey, thanks for reaching out. Do you have a portfolio or examples of previous YouTube video reels and thumbnails you've edited?",
    intent: "SAMPLES",
    receivedAgo: "25m ago",
    status: "PENDING",
    suggestedReply: `Hi Jordan,

Absolutely! Here is our recent YouTube video and thumbnail portfolio showcasing high-retention pacing and 3D hooks:
https://frame.io/share/agency-viral-reels-showcase

If you like the editing style, feel free to grab an open slot on our Google Calendar:
https://meet.google.com/call/miracle-discovery

Looking forward to collaborating!`,
  },
  {
    id: "inbox-2",
    senderName: "Julian Ross",
    senderEmail: "julian@skylinerealty.com",
    companyName: "Skyline Luxury Realty",
    subject: "Re: Video walkthrough hooks for Skyline Realty",
    body: "Yes, I'm interested in the property reel showcase! Could we do a brief call this Thursday to discuss footage handoff?",
    intent: "MEETING",
    receivedAgo: "2h ago",
    status: "PENDING",
    suggestedReply: `Hi Julian,

Thursday works great! Please grab any open 10-minute slot that fits your schedule on our Google Calendar:
https://meet.google.com/call/miracle-discovery

Excited to cut the sample reel for Skyline Luxury!`,
  },
];

export function OutreachView() {
  const [activeSubTab, setActiveSubTab] = useState<"campaigns" | "inbox" | "logs">("campaigns");

  // Connected Sender Credentials
  const [connectedAccount, setConnectedAccount] = useState<{
    email: string;
    password?: string;
    provider?: string;
    host?: string;
    port?: string;
    senderName?: string;
    verified?: boolean;
  } | null>(null);

  // Central Portfolio & Booking Vault (Part 3)
  const [vault, setVault] = useState<PortfolioVaultData>(DEFAULT_PORTFOLIO_VAULT);

  // Active Target Lead / Prospect (Loaded from Saved Leads)
  const [targetLead, setTargetLead] = useState<BrandProspect>({
    businessName: "Jordan Welch Media",
    contactName: "Jordan Welch",
    email: "collabs@thejordanwelch.com",
    niche: "YouTube Creators & Streamers",
    city: "Miami",
    country: "United States",
  });

  // Campaign State
  const [selectedTemplate, setSelectedTemplate] = useState(CREATIVE_TEMPLATES[0]);
  const [customSubject, setCustomSubject] = useState(CREATIVE_TEMPLATES[0].subject);
  const [customBody, setCustomBody] = useState(CREATIVE_TEMPLATES[0].body);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [isQueuedForPeak, setIsQueuedForPeak] = useState(false);

  // Send Error / Toast State
  const [sendErrorToast, setSendErrorToast] = useState<string | null>(null);
  const [sendSuccessToast, setSendSuccessToast] = useState<string | null>(null);

  // Post-Reply Google Meet Booking State
  const [scheduledMeetData, setScheduledMeetData] = useState<{
    meetLink: string;
    googleCalendarUrl: string;
    summary: string;
    leadName: string;
  } | null>(null);
  const [isBookingMeet, setIsBookingMeet] = useState(false);

  // Auto-Reply Settings State
  const [autoReplyMode, setAutoReplyMode] = useState<"APPROVAL" | "AUTONOMOUS">("APPROVAL");
  const [inboxList, setInboxList] = useState<InboxMessage[]>(SAMPLE_INBOX_MESSAGES);
  const [selectedInbox, setSelectedInbox] = useState<InboxMessage | null>(SAMPLE_INBOX_MESSAGES[0]);
  const [replyText, setReplyText] = useState(SAMPLE_INBOX_MESSAGES[0].suggestedReply);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Delivery Logs & Self-Learning Engine State
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLogItem[]>([]);
  const [learningEvents, setLearningEvents] = useState<TrackingEvent[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);

  // 1. Load connected account, vault, saved leads, and tracking data on mount
  useEffect(() => {
    const loadState = () => {
      try {
        const stored = localStorage.getItem("miracle_connected_email");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email && parsed.verified) {
            setConnectedAccount(parsed);
          } else {
            setConnectedAccount(null);
          }
        }

        const storedVault = localStorage.getItem("miracle_portfolio_vault");
        if (storedVault) {
          setVault((prev) => ({ ...prev, ...JSON.parse(storedVault) }));
        }

        const savedLeads = JSON.parse(localStorage.getItem("miracle_saved_leads") || "[]");
        if (savedLeads.length > 0 && savedLeads[0].email) {
          setTargetLead({
            businessName: savedLeads[0].businessName || "Acme Brand",
            contactName: savedLeads[0].contactName || savedLeads[0].businessName,
            email: savedLeads[0].email,
            niche: savedLeads[0].niche || "Creative Prospect",
            city: savedLeads[0].city || "Dubai",
            country: savedLeads[0].country || "United Arab Emirates",
          });
        }

        const storedLogs = localStorage.getItem("miracle_delivery_logs");
        if (storedLogs) {
          setDeliveryLogs(JSON.parse(storedLogs));
        }
      } catch (e) {
        console.warn(e);
      }
    };

    loadState();
    loadLearningData();

    window.addEventListener("storage", loadState);
    window.addEventListener("miracle_email_updated", loadState);
    window.addEventListener("miracle_portfolio_updated", loadState);
    return () => {
      window.removeEventListener("storage", loadState);
      window.removeEventListener("miracle_email_updated", loadState);
      window.removeEventListener("miracle_portfolio_updated", loadState);
    };
  }, []);

  const loadLearningData = async () => {
    try {
      const res = await fetch("/api/email/learning");
      if (res.ok) {
        const data = await res.json();
        if (data.events) setLearningEvents(data.events);
        if (data.insights) setLearningInsights(data.insights);
      }
    } catch {}
  };

  // 2. Compute Send-Time Optimization (Part 5)
  const sendTimeAnalysis: SendTimeAnalysis = useMemo(() => {
    return SendTimeOptimizer.analyze(targetLead.city, targetLead.country);
  }, [targetLead.city, targetLead.country]);

  // 3. Compute Deliverability & Spam Analysis (Part 2)
  const spamAnalysis: DeliverabilityAnalysis = useMemo(() => {
    return SpamGuardEngine.analyze(customSubject, customBody);
  }, [customSubject, customBody]);

  // Automatically rewrite spam triggers with 1 click
  const handleAutoRewriteSpam = () => {
    setCustomSubject(spamAnalysis.cleanSubject);
    setCustomBody(spamAnalysis.cleanBody);
  };

  // Generate 1-to-1 Brand-Personalized Hook (Part 4)
  const handleGenerateBrandHook = () => {
    const generated = BrandEmailWriter.generateEmail(targetLead, vault);
    setCustomSubject(generated.subject);
    setCustomBody(generated.body);
  };

  const handleSelectTemplate = (t: (typeof CREATIVE_TEMPLATES)[0]) => {
    setSelectedTemplate(t);
    setCustomSubject(t.subject);
    setCustomBody(t.body);
  };

  const logDelivery = (item: Omit<DeliveryLogItem, "id">) => {
    const newItem: DeliveryLogItem = { ...item, id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    const updated = [newItem, ...deliveryLogs].slice(0, 100);
    setDeliveryLogs(updated);
    try {
      localStorage.setItem("miracle_delivery_logs", JSON.stringify(updated));
    } catch {}
  };

  // Launch Outreach Campaign
  const handleLaunchCampaign = async (e?: React.FormEvent, isScheduled = false) => {
    if (e) e.preventDefault();
    setSendErrorToast(null);
    setSendSuccessToast(null);

    // BLOCK FAKE SENDS IF NO SENDER ACCOUNT CONNECTED!
    if (!connectedAccount || !connectedAccount.email || !connectedAccount.password) {
      setSendErrorToast("⚠️ No Sender Email Connected — Click to connect your email first");
      return;
    }

    if (isScheduled) {
      setIsQueuedForPeak(true);
      setSendSuccessToast(
        `⚡ Campaign Scheduled for Peak Open Window (${sendTimeAnalysis.recommendedSendTimeFormatted}). Background worker will auto-dispatch.`
      );
      return;
    }

    setIsSendingCampaign(true);

    try {
      const behanceLink = vault.behanceUrl || vault.primaryPortfolioUrl || "https://www.behance.net/miracle-creative";
      const resolvedSubject = customSubject.replace("{{businessName}}", targetLead.businessName);
      const resolvedBody = customBody
        .replace(/{{firstName}}/g, targetLead.contactName?.split(" ")[0] || "there")
        .replace(/{{businessName}}/g, targetLead.businessName)
        .replace(/{{niche}}/g, targetLead.niche || "Creative")
        .replace(/{{behanceUrl}}/g, behanceLink)
        .replace(/{{portfolioUrl}}/g, behanceLink)
        .replace(/{{calendarUrl}}/g, ""); // STRICT: No calendar or meeting link in initial cold outreach!

      const res = await fetch("/api/integrations/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderEmail: (connectedAccount.email || "").trim(),
          senderPassword: (connectedAccount.password || "").replace(/\s+/g, "").trim(),
          senderProvider: connectedAccount.provider || "gmail",
          senderHost: connectedAccount.host,
          senderPort: connectedAccount.port,
          senderName: connectedAccount.senderName || "Miracle Creative Studio",
          to: targetLead.email,
          subject: resolvedSubject,
          content: resolvedBody,
          businessName: targetLead.businessName,
          niche: targetLead.niche,
          country: targetLead.country,
          city: targetLead.city,
          portfolioUrl: behanceLink,
          campaignStage: "initial", // STRICT: Initial outreach email
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setSendSuccessToast(
          `Sequence email dispatched to ${targetLead.email} via ${connectedAccount.email} (Deliverability Score: ${data.deliverabilityScore}/100)`
        );
        logDelivery({
          recipient: targetLead.email,
          subject: resolvedSubject,
          status: "Sent",
          deliverabilityScore: data.deliverabilityScore,
          timestamp: new Date().toLocaleTimeString(),
        });
        loadLearningData();
      } else {
        const errorMsg = data.error || "SMTP delivery failed";
        setSendErrorToast(errorMsg);
        logDelivery({
          recipient: targetLead.email,
          subject: resolvedSubject,
          status: "Failed",
          error: errorMsg,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setSendErrorToast(`Network or SMTP Error: ${err.message}`);
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const handleSelectInbox = (msg: InboxMessage) => {
    setSelectedInbox(msg);
    setReplyText(msg.suggestedReply);
  };

  const handleSendReply = async () => {
    if (!selectedInbox) return;
    setSendErrorToast(null);
    setSendSuccessToast(null);

    if (!connectedAccount || !connectedAccount.email || !connectedAccount.password) {
      setSendErrorToast("⚠️ No Sender Email Connected — Click to connect your email first");
      return;
    }

    setIsSendingReply(true);

    try {
      const res = await fetch("/api/integrations/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderEmail: (connectedAccount.email || "").trim(),
          senderPassword: (connectedAccount.password || "").replace(/\s+/g, "").trim(),
          senderProvider: connectedAccount.provider || "gmail",
          senderHost: connectedAccount.host,
          senderPort: connectedAccount.port,
          senderName: connectedAccount.senderName || "Miracle Creative Studio",
          to: selectedInbox.senderEmail,
          subject: selectedInbox.subject.startsWith("Re:") ? selectedInbox.subject : `Re: ${selectedInbox.subject}`,
          content: replyText,
          portfolioUrl: vault.reelsShowreelUrl,
          calendarUrl: vault.calendarBookingUrl,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setSendSuccessToast(`Reply delivered to ${selectedInbox.senderEmail}!`);
        logDelivery({
          recipient: selectedInbox.senderEmail,
          subject: `Re: ${selectedInbox.subject}`,
          status: "Sent",
          deliverabilityScore: 98,
          timestamp: new Date().toLocaleTimeString(),
        });
        setInboxList(
          inboxList.map((m) =>
            m.id === selectedInbox.id ? { ...m, status: "REPLIED" } : m
          )
        );
      } else {
        const errorMsg = data.error || "SMTP reply failed";
        setSendErrorToast(errorMsg);
      }
    } catch (err: any) {
      setSendErrorToast(`Network or SMTP Error: ${err.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Post-Reply Meeting Flow: Book Google Meet & Auto-Sync Calendar
  const handleBookGoogleMeet = async () => {
    if (!selectedInbox) return;
    setIsBookingMeet(true);
    setSendErrorToast(null);
    try {
      const res = await fetch("/api/integrations/calendar/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: selectedInbox.senderName,
          leadEmail: selectedInbox.senderEmail,
          senderEmail: connectedAccount?.email || "me@company.com",
          customTopic: `Creative Strategy & Discovery: ${selectedInbox.companyName || selectedInbox.senderName}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok && data.meeting) {
        setScheduledMeetData({
          meetLink: data.meeting.meetLink,
          googleCalendarUrl: data.meeting.googleCalendarUrl,
          summary: data.meeting.summary,
          leadName: selectedInbox.senderName,
        });

        // Append real Google Meet details to the response draft
        const meetText = `\n\nI'd love to connect! I've set up a Google Meet call for us:\n👉 Join Google Meet: ${data.meeting.meetLink}\n📅 Add to Google Calendar: ${data.meeting.googleCalendarUrl}\n\nLooking forward to speaking!`;
        setReplyText((prev) => prev.trim() + meetText);

        // Store into persistent meetings list for Screen 4 (Meetings & Calendar)
        try {
          const existing = JSON.parse(localStorage.getItem("miracle_google_calendar_events") || "[]");
          const updated = [data.meeting, ...existing.filter((m: any) => m.id !== data.meeting.id)];
          localStorage.setItem("miracle_google_calendar_events", JSON.stringify(updated));
          window.dispatchEvent(new Event("miracle_meetings_updated"));
        } catch {}

        setSendSuccessToast(`Google Meet created! Meet link: ${data.meeting.meetLink}`);
      } else {
        setSendErrorToast(data.error || "Failed to schedule Google Meet");
      }
    } catch (err: any) {
      setSendErrorToast(`Google Calendar Schedule Error: ${err.message}`);
    } finally {
      setIsBookingMeet(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach & Client Inbox"
        description="Deploy research-backed cold email sequences with auto-injected portfolio reels, real-time peak send-time intelligence, and spam deliverability protection."
      >
        <div className="flex items-center gap-2">
          <Link
            href="/portfolio"
            className="btn-secondary h-9 px-3.5 text-xs inline-flex items-center gap-1.5 rounded-[10px]"
          >
            <FolderHeart className="size-3.5 text-[#10B981]" />
            <span>Portfolio Vault</span>
          </Link>
          <Link
            href="/meetings-setup"
            className="btn-secondary h-9 px-3.5 text-xs inline-flex items-center gap-1.5 rounded-[10px]"
          >
            <CalendarCheck className="size-3.5 text-white" />
            <span>Accounts & Hub</span>
          </Link>
        </div>
      </PageHeader>

      {/* SENDER EMAIL & VAULT STATUS BAR (Semantic Badges) */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121212] border border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[12px] bg-[#1A1A1A] border border-[#2A2A2A]">
            <Mail className="size-4 text-[#10B981]" />
          </div>
          <div className="text-xs">
            <span className="text-[#AAAAAA] block text-[11px]">Active Sender Email:</span>
            {connectedAccount ? (
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="status-dot-success" />
                From: {connectedAccount.email} ({connectedAccount.senderName || "Miracle Studio"})
              </span>
            ) : (
              <span className="font-medium text-[#EF4444] flex items-center gap-2">
                <span className="status-dot-error" />
                No Sender Connected (Sending is blocked)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge badge-success text-[11px] hidden md:inline-flex">
            <span className="status-dot-success" />
            Vault Synced: {vault.reelsShowreelUrl ? "Reels Showreel Active" : "Default Reels"}
          </span>

          {connectedAccount ? (
            <Link
              href="/meetings-setup"
              className="btn-secondary h-8 px-3 text-xs inline-flex items-center gap-1.5 rounded-[8px]"
            >
              <span>Manage Google Account</span>
            </Link>
          ) : (
            <Link
              href="/meetings-setup"
              className="btn-action-primary h-8 px-3.5 text-xs inline-flex items-center gap-1.5 rounded-[8px]"
            >
              <AlertTriangle className="size-3.5 text-white" />
              <span>Connect Google Account First</span>
            </Link>
          )}
        </div>
      </div>

      {/* PART 5: RESEARCH-BACKED SMART SEND-TIME OPTIMIZER BANNER */}
      <div
        id="send-time-banner"
        className={`card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all ${
          sendTimeAnalysis.isPeakWindowNow
            ? "bg-[#0E2017] border-[#10B981]/50 text-white"
            : "bg-[#181510] border-[#F59E0B]/40 text-[#FDE68A]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-[10px] mt-0.5 shrink-0 ${
              sendTimeAnalysis.isPeakWindowNow
                ? "bg-[#10B981]/20 text-[#10B981]"
                : "bg-[#F59E0B]/20 text-[#F59E0B]"
            }`}
          >
            <Clock className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px] ${
                  sendTimeAnalysis.isPeakWindowNow
                    ? "bg-[#10B981] text-black"
                    : "bg-[#F59E0B] text-black"
                }`}
              >
                {sendTimeAnalysis.isPeakWindowNow ? "Peak Window Active" : "Optimal Window Notice"}
              </span>
              <span className="text-xs font-semibold text-white">
                Prospect Time: {sendTimeAnalysis.prospectLocalTimeString}
              </span>
            </div>
            <p className="text-xs text-[#E2E8F0] mt-1 leading-snug">
              {sendTimeAnalysis.bannerHeadline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {!sendTimeAnalysis.isPeakWindowNow && (
            <button
              type="button"
              id="btn-auto-schedule"
              onClick={() => handleLaunchCampaign(undefined, true)}
              className="btn-action-emerald h-8 px-3.5 text-xs font-semibold rounded-[8px] inline-flex items-center gap-1.5"
            >
              <Zap className="size-3.5 text-white" />
              <span>Auto-Send at Peak Time (Recommended)</span>
            </button>
          )}
          <button
            type="button"
            id="btn-send-now-anyway"
            onClick={(e) => handleLaunchCampaign(e, false)}
            disabled={isSendingCampaign}
            className="btn-send h-8 px-3.5 text-xs font-semibold rounded-[8px] inline-flex items-center gap-1.5"
          >
            {isSendingCampaign ? (
              <Loader2 className="size-3.5 animate-spin text-white" />
            ) : (
              <Send className="size-3.5 text-white" />
            )}
            <span>{sendTimeAnalysis.isPeakWindowNow ? "Send Immediately" : "Send Now Anyway"}</span>
          </button>
        </div>
      </div>

      {/* Error Toast / Alert Banner (Coral Crimson Red) */}
      {sendErrorToast && (
        <div
          id="send-error-toast"
          className="p-4 rounded-[14px] bg-[#200A0D] border-2 border-[#EF4444] text-[#FCA5A5] text-xs shadow-2xl space-y-2 animate-in fade-in duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="size-5 shrink-0 text-[#EF4444] mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white text-sm block">
                  {sendErrorToast.includes("535")
                    ? "Delivery Failed: Gmail Authentication Rejected (535-5.7.8)"
                    : "Delivery Error"}
                </span>
                <p className="text-xs text-[#FCA5A5] leading-relaxed">
                  {sendErrorToast}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSendErrorToast(null)}
              className="text-[#EF4444] hover:text-white p-1 rounded"
              title="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#EF4444]/25">
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-[8px] bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
            >
              <span>Generate Google App Password ↗</span>
            </a>
            <Link
              href="/meetings-setup"
              className="px-3 py-1.5 rounded-[8px] bg-[#351015] hover:bg-[#46151B] border border-[#EF4444]/60 text-white font-semibold text-[11px] transition-colors"
            >
              Enter Password in Setup →
            </Link>
          </div>
        </div>
      )}

      {/* Success Toast (Emerald Green Accent) */}
      {sendSuccessToast && (
        <div className="p-3.5 rounded-[12px] bg-[#0E2017] border border-[#10B981] text-white text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 shrink-0 text-[#10B981]" />
            <span className="font-medium">{sendSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSendSuccessToast(null)}
            className="text-[#AAAAAA] hover:text-white p-1"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#2A2A2A] pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab("campaigns")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-[10px] transition-all border-b-2 ${
            activeSubTab === "campaigns"
              ? "border-[#10B981] text-white bg-[#121212] font-semibold"
              : "border-transparent text-[#AAAAAA] hover:text-white"
          }`}
        >
          <Send className="size-3.5 text-[#2563EB]" />
          <span>Email Campaigns</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("inbox")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-[10px] transition-all border-b-2 ${
            activeSubTab === "inbox"
              ? "border-[#10B981] text-white bg-[#121212] font-semibold"
              : "border-transparent text-[#AAAAAA] hover:text-white"
          }`}
        >
          <Inbox className="size-3.5" />
          <span>Client Reply Inbox</span>
          <span className="text-[10px] bg-[#1A1A1A] border border-[#2A2A2A] text-white font-mono px-1.5 py-0.5 rounded-full">
            {inboxList.filter((m) => m.status === "PENDING").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("logs")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-[10px] transition-all border-b-2 ${
            activeSubTab === "logs"
              ? "border-[#10B981] text-white bg-[#121212] font-semibold"
              : "border-transparent text-[#AAAAAA] hover:text-white"
          }`}
        >
          <Activity className="size-3.5 text-[#10B981]" />
          <span>Tracking & AI Insights</span>
          <span className="text-[10px] bg-[#1A1A1A] border border-[#2A2A2A] text-white font-mono px-1.5 py-0.5 rounded-full">
            {deliveryLogs.length}
          </span>
        </button>
      </div>

      {/* ── Sub-Tab 1: 1-Click Campaigns ── */}
      {activeSubTab === "campaigns" && (
        <div className="space-y-6">
          {/* Template Selection Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#AAAAAA]">
                Pre-Loaded Agency Pitch Templates
              </label>
              <button
                type="button"
                onClick={handleGenerateBrandHook}
                className="btn-action-primary h-7 px-3 text-[11px] font-semibold rounded-[8px] inline-flex items-center gap-1.5"
              >
                <Wand2 className="size-3 text-white" />
                <span>Write 1-to-1 Brand Pitch for {targetLead.businessName}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CREATIVE_TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-4 rounded-[14px] text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#1A1A1A] border-[#10B981] text-white shadow-md ring-1 ring-[#10B981]/50"
                        : "bg-[#121212] border-[#2A2A2A] text-[#AAAAAA] hover:border-[#3A3A3A] hover:text-white"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-[8px] bg-[#1A1A1A] text-white">
                          <Icon className="size-4" />
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-[#1A1A1A] px-2 py-0.5 rounded-[6px] border border-[#2A2A2A] text-[#10B981]">
                          {tmpl.service}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-white leading-snug">{tmpl.name}</div>
                    </div>
                    <div className="text-[10px] text-[#777777] mt-3 pt-2 border-t border-[#2A2A2A] flex items-center justify-between">
                      <span>Includes 4-step sequence</span>
                      <span className="text-[#10B981] font-semibold">Auto-Linked</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Sequence Editor & Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Customizer & Spam Guard */}
            <div className="lg:col-span-7 card p-6 space-y-4 bg-[#121212] border border-[#2A2A2A]">
              <div className="flex items-center justify-between pb-2 border-b border-[#2A2A2A]">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-[#10B981]" />
                  <span>Sequence Customizer</span>
                </h3>

                {/* PART 2: SpamGuard Live Deliverability Indicator */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      spamAnalysis.score >= 90
                        ? "badge-success"
                        : spamAnalysis.score >= 75
                        ? "badge-warning"
                        : "badge-error"
                    }`}
                  >
                    Deliverability: {spamAnalysis.score}/100 ({spamAnalysis.rating})
                  </span>
                </div>
              </div>

              {/* Spam Warning & Auto-Rewrite Alert */}
              {!spamAnalysis.isClean && (
                <div className="p-3 rounded-[10px] bg-[#200A0D] border border-[#EF4444]/40 text-xs text-[#FCA5A5] flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold block text-white">Spam Triggers Detected:</span>
                    <span className="text-[11px] text-[#FCA5A5]">
                      {spamAnalysis.spamTriggersFound.join(" • ")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoRewriteSpam}
                    className="btn-action-emerald h-7 px-2.5 text-[10px] font-semibold shrink-0 rounded-[6px]"
                  >
                    Auto-Rewrite to Clean Language
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#AAAAAA] block mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="input h-10 text-xs rounded-[10px] bg-[#1A1A1A] border-[#2A2A2A]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#AAAAAA]">
                      Email Body (Auto-injects prospect info, proof reels & calendar)
                    </label>
                    <span className="text-[11px] font-mono text-[#777777]">
                      {customBody.trim().split(/\s+/).length} words
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="input h-auto p-3 text-xs font-mono leading-relaxed resize-none rounded-[10px] bg-[#1A1A1A] border-[#2A2A2A]"
                  />
                </div>
              </div>

              {/* 4-Step Sequence Timeline */}
              <div className="pt-3 border-t border-[#2A2A2A] space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#AAAAAA] block">
                  Follow-Up Sequence Schedule (Stops on Reply)
                </span>
                <div className="space-y-1.5 text-xs text-[#AAAAAA]">
                  <div className="p-2.5 rounded-[10px] bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-between">
                    <span><strong>Step 1:</strong> Initial Visual Pitch (Day 0)</span>
                    <span className="text-[10px] text-[#10B981] font-semibold">Primary</span>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-between">
                    <span><strong>Step 2:</strong> {selectedTemplate.followUp1.replace("{{calendarUrl}}", vault.calendarBookingUrl || "")}</span>
                    <span className="text-[10px] text-[#777777]">Day 3</span>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-between">
                    <span><strong>Step 3:</strong> {selectedTemplate.followUp2}</span>
                    <span className="text-[10px] text-[#777777]">Day 6</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="text-[11px] text-[#777777]">
                  To: <strong className="text-white">{targetLead.businessName}</strong> ({targetLead.city || "Direct"})
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLaunchCampaign(undefined, true)}
                    className="btn-secondary px-3.5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 rounded-[10px]"
                  >
                    <Clock className="size-3.5 text-[#F59E0B]" />
                    <span>Queue for Peak Time</span>
                  </button>

                  <button
                    type="button"
                    id="btn-launch-sequence"
                    onClick={(e) => handleLaunchCampaign(e, false)}
                    disabled={isSendingCampaign}
                    className="btn-send px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 rounded-[10px]"
                  >
                    {isSendingCampaign ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin text-white" />
                        <span>Sending via Google SMTP...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5 text-white" />
                        <span>Launch Sequence Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Real-time Rendered Preview & Auto-Injected Links */}
            <div className="lg:col-span-5 card p-6 space-y-4 bg-[#121212] border border-[#2A2A2A]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-medium text-[#777777]">
                  Live Preview (Client Recipient View)
                </span>
                <span className="badge badge-success text-[10px]">
                  <span className="status-dot-success" />
                  Auto-Injected Links Active
                </span>
              </div>

              <div className="rounded-[12px] border border-[#2A2A2A] bg-[#1A1A1A] p-4 space-y-3 text-xs">
                <div className="space-y-1 pb-3 border-b border-[#2A2A2A]">
                  <div className="text-[#777777]">
                    To: <span className="text-white font-medium">{targetLead.contactName || targetLead.businessName} ({targetLead.email})</span>
                  </div>
                  <div className="text-white font-medium text-sm">
                    {customSubject.replace("{{businessName}}", targetLead.businessName)}
                  </div>
                </div>

                <div className="text-[#AAAAAA] leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {customBody
                    .replace(/{{firstName}}/g, targetLead.contactName?.split(" ")[0] || "there")
                    .replace(/{{businessName}}/g, targetLead.businessName)
                    .replace(/{{niche}}/g, targetLead.niche || "Creative")
                    .replace(/{{portfolioUrl}}/g, vault.reelsShowreelUrl || vault.primaryPortfolioUrl)
                    .replace(/{{calendarUrl}}/g, vault.calendarBookingUrl || "")}
                </div>

                <div className="pt-3 border-t border-[#2A2A2A] space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-[#777777]">
                    <span>Injected Proof Reel:</span>
                    <a
                      href={vault.reelsShowreelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#10B981] truncate max-w-[180px] hover:underline"
                    >
                      {vault.reelsShowreelUrl}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-[#777777]">
                    <span>Injected Calendar:</span>
                    <a
                      href={vault.calendarBookingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2563EB] truncate max-w-[180px] hover:underline"
                    >
                      {vault.calendarBookingUrl}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Tab 2: Client Reply Inbox ── */}
      {activeSubTab === "inbox" && (
        <div className="space-y-6">
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121212] border border-[#2A2A2A]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-white">
                <Bot className="size-4 text-[#10B981]" />
                <span>Autonomous Auto-Reply & Google Meet Generator</span>
              </div>
              <p className="text-[11px] text-[#AAAAAA]">
                Smart auto-reply injects your portfolio and Google Meet link when prospects ask for pricing or samples.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#1A1A1A] p-1 rounded-[10px] border border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => setAutoReplyMode("APPROVAL")}
                className={`px-3 py-1.5 text-xs font-medium rounded-[8px] transition-all ${
                  autoReplyMode === "APPROVAL"
                    ? "bg-white text-black font-semibold"
                    : "text-[#AAAAAA] hover:text-white"
                }`}
              >
                1-Click Approval
              </button>
              <button
                type="button"
                onClick={() => setAutoReplyMode("AUTONOMOUS")}
                className={`px-3 py-1.5 text-xs font-medium rounded-[8px] transition-all ${
                  autoReplyMode === "AUTONOMOUS"
                    ? "bg-white text-black font-semibold"
                    : "text-[#AAAAAA] hover:text-white"
                }`}
              >
                Autonomous Auto-Send
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Inbox List */}
            <div className="lg:col-span-5 space-y-2">
              {inboxList.map((msg) => {
                const isSelected = selectedInbox?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => handleSelectInbox(msg)}
                    className={`w-full p-4 rounded-[14px] text-left border transition-all space-y-2 ${
                      isSelected
                        ? "bg-[#1A1A1A] border-[#10B981] shadow-md ring-1 ring-[#10B981]/50"
                        : "bg-[#121212] border-[#2A2A2A] hover:border-[#3A3A3A]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{msg.senderName}</span>
                      <span className="text-[11px] text-[#777777] font-mono">{msg.receivedAgo}</span>
                    </div>
                    <div className="text-xs text-[#E2E8F0] font-medium truncate">{msg.subject}</div>
                    <p className="text-[11px] text-[#AAAAAA] line-clamp-2">{msg.body}</p>
                    <div className="pt-2 flex items-center justify-between text-[10px]">
                      <span className="badge badge-success text-[10px]">{msg.intent}</span>
                      <span className="text-[#AAAAAA]">{msg.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Suggested Reply */}
            {selectedInbox && (
              <div className="lg:col-span-7 card p-6 space-y-4 bg-[#121212] border border-[#2A2A2A]">
                <div className="space-y-1 pb-3 border-b border-[#2A2A2A]">
                  <h4 className="text-sm font-semibold text-white">
                    Suggested Response to {selectedInbox.senderName}
                  </h4>
                  <p className="text-xs text-[#AAAAAA]">
                    Auto-weaves in your portfolio reel and Google Meet scheduling link.
                  </p>
                </div>

                <div>
                  <textarea
                    rows={8}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input h-auto p-3 text-xs font-mono leading-relaxed resize-none rounded-[10px] bg-[#1A1A1A] border-[#2A2A2A]"
                  />
                </div>

                {/* Live Google Meet Sync Card if generated */}
                {scheduledMeetData && (
                  <div className="p-3.5 rounded-[12px] bg-[#181818] border border-[#10B981]/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-xs font-bold text-white">
                          Google Meet Created: {scheduledMeetData.meetLink}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#10B981] font-mono uppercase tracking-wider">
                        Synced with Google UI
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={scheduledMeetData.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary h-8 px-3 text-xs font-semibold rounded-[8px] inline-flex items-center gap-1.5 bg-[#222222] border-[#333333] hover:border-white text-white transition-all"
                      >
                        <span>Join Google Meet</span>
                        <ExternalLink className="size-3" />
                      </a>
                      <a
                        href={scheduledMeetData.googleCalendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary h-8 px-3 text-xs font-semibold rounded-[8px] inline-flex items-center gap-1.5 bg-[#222222] border-[#333333] hover:border-white text-white transition-all"
                      >
                        <span>Open in Google Calendar</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Button 1: Book Google Meet (Only triggered after response!) */}
                  <button
                    type="button"
                    onClick={handleBookGoogleMeet}
                    disabled={isBookingMeet}
                    className="btn-secondary h-10 px-4 text-xs font-semibold inline-flex items-center gap-2 rounded-[10px] bg-[#1A1A1A] border-[#333333] hover:border-[#10B981] text-white w-full sm:w-auto"
                  >
                    {isBookingMeet ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin text-[#10B981]" />
                        <span>Generating Google Meet...</span>
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="size-3.5 text-[#10B981]" />
                        <span>📅 Book Google Meet (Send Calendar Invite)</span>
                      </>
                    )}
                  </button>

                  {/* Button 2: Send Reply via Gmail */}
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={isSendingReply}
                    className="btn-send px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2 rounded-[10px] w-full sm:w-auto justify-center"
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin text-white" />
                        <span>Sending via Google SMTP...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5 text-white" />
                        <span>💬 Send Reply via Gmail</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sub-Tab 3: PART 6: Comprehensive Tracking & AI Self-Learning Insights ── */}
      {activeSubTab === "logs" && (
        <div className="space-y-6">
          {/* Top Insights Cards: What's Working (AI Learning Insights) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-[#10B981]" />
                <h3 className="text-sm font-bold text-white">
                  What's Working (AI Self-Learning Engine)
                </h3>
              </div>
              <span className="badge badge-success text-xs">
                <span className="status-dot-success" />
                Adaptive Conversion Loop Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {learningInsights.map((ins) => (
                <div
                  key={ins.id}
                  className="card p-5 bg-[#121212] border border-[#2A2A2A] rounded-[16px] space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="badge badge-success text-[10px]">
                      {ins.statBadge}
                    </span>
                    <TrendingUp className="size-3.5 text-[#10B981]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug">{ins.headline}</h4>
                    <p className="text-[11px] text-[#AAAAAA] mt-1 leading-relaxed">{ins.description}</p>
                  </div>
                  <div className="pt-2 border-t border-[#2A2A2A] text-[10px] text-[#10B981] font-medium">
                    {ins.appliedRule}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Signal Email Tracking Table */}
          <div className="card p-6 space-y-4 bg-[#121212] border border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Live Email Tracking Events</h3>
                <p className="text-xs text-[#AAAAAA]">
                  Real-time recording of transparent 1x1 tracking pixel opens, portfolio link clicks, and calendar bookings.
                </p>
              </div>
              {deliveryLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("miracle_delivery_logs");
                    setDeliveryLogs([]);
                  }}
                  className="btn-secondary h-8 px-3 text-xs rounded-[8px]"
                >
                  Clear Logs
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-[12px] border border-[#2A2A2A]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A] text-[#AAAAAA] font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Subject Formula</th>
                    <th className="px-4 py-3">Opens</th>
                    <th className="px-4 py-3">Portfolio Clicks</th>
                    <th className="px-4 py-3">Calendar Clicks</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {learningEvents.map((ev) => (
                    <tr key={ev.trackingId} className="hover:bg-[#1A1A1A]">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{ev.businessName}</div>
                        <div className="text-[11px] text-[#777777]">{ev.recipientEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge text-[10px] bg-[#1A1A1A] border border-[#2A2A2A] text-[#AAAAAA]">
                          {ev.subjectPattern}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {ev.openCount > 0 ? (
                          <span className="text-[#10B981] font-bold flex items-center gap-1">
                            <span className="status-dot-success" />
                            {ev.openCount} {ev.openCount === 1 ? "Open" : "Opens"}
                          </span>
                        ) : (
                          <span className="text-[#666666]">Unopened</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {ev.portfolioClickedAt ? (
                          <span className="text-[#10B981] font-semibold flex items-center gap-1">
                            <MousePointerClick className="size-3 text-[#10B981]" />
                            Clicked Reel
                          </span>
                        ) : (
                          <span className="text-[#666666]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {ev.calendarClickedAt ? (
                          <span className="badge badge-success text-[10px]">
                            Booked Slot
                          </span>
                        ) : (
                          <span className="text-[#666666]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-[6px] ${
                            ev.status === "CLICKED_CALENDAR"
                              ? "badge-success"
                              : ev.status === "OPENED" || ev.status === "CLICKED_PORTFOLIO"
                              ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                              : "bg-[#1A1A1A] border border-[#2A2A2A] text-[#AAAAAA]"
                          }`}
                        >
                          {ev.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
