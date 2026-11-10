"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderHeart,
  KeyRound,
  Link2,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Trash2,
  User,
  Sliders,
  Shield,
  X,
  Lock,
  Unlock,
  Bot,
  DollarSign,
  Layers,
  Cpu,
  CheckSquare,
} from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

type SettingsTab =
  | "profile"
  | "email"
  | "calendar"
  | "behance"
  | "ai"
  | "scrapegraph"
  | "services"
  | "agent"
  | "automation"
  | "safety"
  | "suppression";

export function SettingsManager() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // 1. Profile State
  const [senderName, setSenderName] = useState("Zohaib");
  const [businessName, setBusinessName] = useState("Miracle Creative Studio");
  const [businessEmail, setBusinessEmail] = useState("zohaibaidesigner@gmail.com");
  const [servicesOffered, setServicesOffered] = useState("Graphic Design, Brand Identity & High-Converting Video Editing");
  const [timezone, setTimezone] = useState("America/New_York");
  const [emailSignature, setEmailSignature] = useState("Best regards,\nZohaib\nMiracle Creative Studio");

  // 2. Email Connection State
  const [emailProvider, setEmailProvider] = useState<"GMAIL" | "CUSTOM_SMTP">("GMAIL");
  const [connectedEmail, setConnectedEmail] = useState("zohaibaidesigner@gmail.com");
  const [appPassword, setAppPassword] = useState("axtc hxze kqqe uvxo");
  const [dailySendLimit, setDailySendLimit] = useState(50);
  const [testRecipient, setTestRecipient] = useState("zohaibaidesigner@gmail.com");
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  // 3. Calendar Connection State
  const [calendarEmail, setCalendarEmail] = useState("");
  const [calendarStatus, setCalendarStatus] = useState<string>("CONFIGURATION_REQUIRED");
  const [selectedCalendarId, setSelectedCalendarId] = useState("primary");
  const [selectedCalendarName, setSelectedCalendarName] = useState("Primary Google Calendar");
  const [bookingUrl, setBookingUrl] = useState("https://calendar.google.com/calendar/u/0/appointments/schedules");
  const [enableMeet, setEnableMeet] = useState(true);
  const [callDuration, setCallDuration] = useState(15);
  const [showCalendarDetails, setShowCalendarDetails] = useState(false);
  const [calendarTestNotice, setCalendarTestNotice] = useState<string | null>(null);
  const [testingCalendar, setTestingCalendar] = useState(false);

  // 4. Behance State & Vault (Authoritative Database Stored URL)
  const [behanceUrl, setBehanceUrl] = useState("");
  const [isBehanceLocked, setIsBehanceLocked] = useState(true);
  const [behanceNotice, setBehanceNotice] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [newProjectNiche, setNewProjectNiche] = useState("Real Estate & Luxury Brands");
  const [behanceProjects, setBehanceProjects] = useState<any[]>([]);

  // 5. AI Connections (Gemini + Black Bird Gateway)
  const [aiProvider, setAiProvider] = useState<"gemini" | "blackbird">("blackbird");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [geminiStatus, setGeminiStatus] = useState<string | null>(null);
  const [testingGemini, setTestingGemini] = useState(false);
  const [bbPaired, setBbPaired] = useState(false);
  const [bbStatus, setBbStatus] = useState("DISCONNECTED");
  const [bbEndpoint, setBbEndpoint] = useState("http://127.0.0.1:20129");
  const [bbModels, setBbModels] = useState<string[]>([]);
  const [bbPreferredModel, setBbPreferredModel] = useState("gemini-cli/gemini-2.0-flash");
  const [bbNotice, setBbNotice] = useState<string | null>(null);
  const [pairingBB, setPairingBB] = useState(false);
  const [testingBB, setTestingBB] = useState(false);

  // 6. Services & Packages
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  const [servicesNotice, setServicesNotice] = useState<string | null>(null);

  // 7. AI Client Agent
  const [agentMode, setAgentMode] = useState<"DRAFT_ONLY" | "SMART_AUTO_REPLY" | "ADVANCED_AUTO_REPLY">("DRAFT_ONLY");
  const [agentPaused, setAgentPaused] = useState(false);
  const [strictPricing, setStrictPricing] = useState(true);
  const [requireNegotiationApproval, setRequireNegotiationApproval] = useState(true);
  const [agentNotice, setAgentNotice] = useState<string | null>(null);

  // 6. Automation State
  const [followUpDelay1, setFollowUpDelay1] = useState(3);
  const [followUpDelay2, setFollowUpDelay2] = useState(6);
  const [stopOnReply, setStopOnReply] = useState(true);
  const [stopOnMeeting, setStopOnMeeting] = useState(true);
  const [dncList, setDncList] = useState("badfit@domain.com\ncompetitor.com");

  // 7. Safety & Operating Mode State (Section 1 & 2 Mandates)
  const [operatingMode, setOperatingMode] = useState<"TESTING" | "LIVE_PAUSED" | "LIVE_ACTIVE">("TESTING");
  const [outreachPaused, setOutreachPaused] = useState<boolean>(false);
  const [approvedTestRecipient, setApprovedTestRecipient] = useState<string>("zohaibaidesigner@gmail.com");
  const [safetyEngineNotice, setSafetyEngineNotice] = useState<string | null>(null);
  const [togglingSafety, setTogglingSafety] = useState(false);

  // 8. Suppression Registry Summary
  const [suppressionStats, setSuppressionStats] = useState<{
    totalSuppressed: number;
    activeLeads: number;
    binLeads: number;
    archivedLeads: number;
  }>({
    totalSuppressed: 0,
    activeLeads: 0,
    binLeads: 0,
    archivedLeads: 0,
  });

  // 9. ScrapeGraphAI Lead Discovery Source
  const [scrapeGraphApiKey, setScrapeGraphApiKey] = useState("");
  const [scrapeGraphEnabled, setScrapeGraphEnabled] = useState(false);
  const [scrapeGraphMaxCredits, setScrapeGraphMaxCredits] = useState(10);
  const [scrapeGraphCreditsRemaining, setScrapeGraphCreditsRemaining] = useState<number | null>(null);
  const [scrapeGraphStatus, setScrapeGraphStatus] = useState("NOT_CONFIGURED");
  const [scrapeGraphNotice, setScrapeGraphNotice] = useState<string | null>(null);
  const [isTestingScrapeGraph, setIsTestingScrapeGraph] = useState(false);

  // Load persistent settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.settings) {
          const s = data.settings;
          if (s.businessProfile) {
            setSenderName(s.businessProfile.senderName || "Zohaib");
            setBusinessName(s.businessProfile.businessName || "Miracle Creative Studio");
            setBusinessEmail(s.businessProfile.businessEmail || "zohaibaidesigner@gmail.com");
            setServicesOffered(s.businessProfile.servicesOffered || "Graphic Design & Video Editing");
            setTimezone(s.businessProfile.timezone || "America/New_York");
            setEmailSignature(s.businessProfile.emailSignature || `Best regards,\n${s.businessProfile.senderName || "Zohaib"}\n${s.businessProfile.businessName || "Miracle Creative Studio"}`);
          }
          if (s.emailAccount) {
            setConnectedEmail(s.emailAccount.email || "zohaibaidesigner@gmail.com");
            setDailySendLimit(s.emailAccount.dailyLimit || 50);
          }
          if (s.calendar) {
            setBookingUrl(s.calendar.bookingUrl || "");
            setEnableMeet(s.calendar.enableGoogleMeet ?? true);
            setCallDuration(s.calendar.callDurationMinutes || 15);
            setCalendarEmail(s.calendar.accountEmail || "");
            setSelectedCalendarId(s.calendar.selectedCalendarId || "primary");
            setSelectedCalendarName(s.calendar.selectedCalendarName || "Primary Google Calendar");
          }
          if (s.behance) {
            setBehanceUrl(s.behance.profileUrl || s.behance.primary_behance_profile_url || "");
            if (Array.isArray(s.behance.featuredProjects) && s.behance.featuredProjects.length > 0) {
              setBehanceProjects(s.behance.featuredProjects);
            }
          }
          if (s.gemini) {
            setGeminiApiKey(s.gemini.apiKey || "");
            setGeminiModel(s.gemini.model || "gemini-2.5-flash");
          }
          if (s.scrapegraph) {
            setScrapeGraphApiKey(s.scrapegraph.apiKey || "");
            setScrapeGraphEnabled(Boolean(s.scrapegraph.enabled));
            setScrapeGraphMaxCredits(s.scrapegraph.maxCreditsPerSearch || 10);
            setScrapeGraphCreditsRemaining(s.scrapegraph.creditsRemaining ?? null);
            setScrapeGraphStatus(s.scrapegraph.status || "NOT_CONFIGURED");
          }
        }
      })
      .catch(() => undefined);

    // Query live ScrapeGraphAI config
    fetch("/api/integrations/scrapegraph")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.config) {
          if (d.config.apiKey) setScrapeGraphApiKey(d.config.apiKey);
          setScrapeGraphEnabled(Boolean(d.config.enabled));
          setScrapeGraphMaxCredits(d.config.maxCreditsPerSearch || 10);
          setScrapeGraphCreditsRemaining(d.config.creditsRemaining ?? null);
          setScrapeGraphStatus(d.config.status || "NOT_CONFIGURED");
        }
      })
      .catch(() => undefined);

    // Also query live calendar status
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setCalendarStatus(d.status);
          if (d.accountEmail) setCalendarEmail(d.accountEmail);
          if (d.selectedCalendarName) setSelectedCalendarName(d.selectedCalendarName);
        }
      })
      .catch(() => undefined);

    // Query safety settings
    fetch("/api/settings/safety")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.safety) {
          setOperatingMode(d.safety.operatingMode);
          setOutreachPaused(d.safety.outreachPaused || d.safety.operatingMode === "LIVE_PAUSED");
          if (d.safety.approvedTestRecipient) {
            setApprovedTestRecipient(d.safety.approvedTestRecipient);
          }
        }
      })
      .catch(() => undefined);

    // Query suppression registry & lead counts
    fetch("/api/leads?tab=ALL")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setSuppressionStats((prev) => ({ ...prev, activeLeads: d.count || 0 }));
        }
      })
      .catch(() => undefined);

    fetch("/api/leads?tab=BIN")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setSuppressionStats((prev) => ({ ...prev, binLeads: d.count || 0 }));
        }
      })
      .catch(() => undefined);

    fetch("/api/leads?tab=ARCHIVED")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setSuppressionStats((prev) => ({ ...prev, archivedLeads: d.count || 0 }));
        }
      })
      .catch(() => undefined);

    // Query Behance Vault
    fetch("/api/settings/behance")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          if (d.profileUrl) setBehanceUrl(d.profileUrl);
          setIsBehanceLocked(Boolean(d.isLocked));
          if (Array.isArray(d.featuredProjects)) setBehanceProjects(d.featuredProjects);
        }
      })
      .catch(() => undefined);

    // Query Black Bird status
    fetch("/api/integrations/blackbird")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setBbPaired(Boolean(d.isPaired));
          setBbStatus(d.status || "DISCONNECTED");
          setBbEndpoint(d.endpoint || "http://127.0.0.1:20129");
          if (Array.isArray(d.models)) setBbModels(d.models);
          if (d.preferredModel) setBbPreferredModel(d.preferredModel);
          if (d.activeEngine) setAiProvider(d.activeEngine === "blackbird" ? "blackbird" : "gemini");
        }
      })
      .catch(() => undefined);

    // Query Services Catalog
    fetch("/api/settings/services")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.catalog)) {
          setServicesCatalog(d.catalog);
        }
      })
      .catch(() => undefined);

    // Query Conversation Agent Settings
    fetch("/api/conversation")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.settings) {
          setAgentMode(d.settings.mode || "DRAFT_ONLY");
          setAgentPaused(Boolean(d.settings.paused));
          setStrictPricing(Boolean(d.settings.strictPricingBoundaries));
          setRequireNegotiationApproval(Boolean(d.settings.requireHumanApprovalOnNegotiation));
        }
      })
      .catch(() => undefined);
  }, []);

  // Update signature automatically when sender or business name changes if signature was untouched
  const handleSenderNameChange = (val: string) => {
    setSenderName(val);
    if (!emailSignature || emailSignature.includes("Best regards,")) {
      setEmailSignature(`Best regards,\n${val}\n${businessName}`);
    }
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const payload = {
      businessProfile: {
        businessName,
        senderName,
        businessEmail,
        servicesOffered,
        emailSignature,
        timezone,
      },
      emailAccount: {
        provider: emailProvider,
        email: connectedEmail,
        dailyLimit: dailySendLimit,
        hasAppPassword: Boolean(appPassword),
      },
      calendar: {
        bookingUrl,
        enableGoogleMeet: enableMeet,
        callDurationMinutes: callDuration,
        selectedCalendarId,
        selectedCalendarName,
        accountEmail: calendarEmail,
      },
      behance: {
        profileUrl: behanceUrl,
        featuredProjects: behanceProjects,
      },
      gemini: {
        apiKey: geminiApiKey,
        model: geminiModel,
      },
      scrapegraph: {
        apiKey: scrapeGraphApiKey,
        enabled: scrapeGraphEnabled,
        maxCreditsPerSearch: scrapeGraphMaxCredits,
        creditsRemaining: scrapeGraphCreditsRemaining,
        status: scrapeGraphStatus,
      },
      automation: {
        followUpDelay1,
        followUpDelay2,
        stopOnReply,
        stopOnMeeting,
        dncList: dncList.split("\n").map((s) => s.trim()).filter(Boolean),
      },
    };

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        setSavedNotice("✓ Settings saved successfully and synchronized across Pitch Studio and AI engines.");
        setTimeout(() => setSavedNotice(null), 3500);
      }
    } catch (err: any) {
      setSavedNotice(`Save error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCalendar = async () => {
    setTestingCalendar(true);
    setCalendarTestNotice(null);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      setCalendarTestNotice(data.diagnostic || (data.ok ? "✓ Google Calendar verified!" : "Connection check failed"));
      if (data.testEventUrl) {
        window.open(data.testEventUrl, "_blank");
      }
    } catch (err: any) {
      setCalendarTestNotice(`Test error: ${err.message}`);
    } finally {
      setTestingCalendar(false);
      setTimeout(() => setCalendarTestNotice(null), 6000);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiStatus(null);
    try {
      const res = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", testKey: geminiApiKey }),
      });
      const data = await res.json();
      if (data.ok) {
        setGeminiStatus(data.message || "✓ Gemini API connected!");
      } else {
        setGeminiStatus(`Error: ${data.error || "Connection failed"}`);
      }
    } catch (err: any) {
      setGeminiStatus(`Error: ${err.message}`);
    } finally {
      setTestingGemini(false);
      setTimeout(() => setGeminiStatus(null), 5000);
    }
  };

  const handleTestScrapeGraph = async () => {
    setIsTestingScrapeGraph(true);
    setScrapeGraphNotice(null);
    try {
      const res = await fetch("/api/integrations/scrapegraph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", apiKey: scrapeGraphApiKey }),
      });
      const data = await res.json();
      if (data.ok) {
        setScrapeGraphStatus("CONNECTED");
        setScrapeGraphCreditsRemaining(data.credits ?? null);
        setScrapeGraphNotice(`✓ Connected successfully! Credits remaining: ${data.credits ?? "Available"}`);
      } else {
        setScrapeGraphStatus("ERROR");
        setScrapeGraphNotice(`Connection failed: ${data.error || "Invalid API key"}`);
      }
    } catch (e: any) {
      setScrapeGraphStatus("ERROR");
      setScrapeGraphNotice(`Error: ${e.message}`);
    } finally {
      setIsTestingScrapeGraph(false);
    }
  };

  const handleTestSendEmail = async () => {
    setIsSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch("/api/integrations/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testRecipient,
          subject: "Miracle Outreach Engine — Connection Verification",
          body: `Hello ${senderName},\n\nYour outbound email delivery via Gmail/SMTP is verified and ready for live cold outreach.\n\n${emailSignature}`,
          company: businessName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestEmailStatus(`✓ Test email delivered to ${testRecipient}! Message ID: ${data.messageId || "sent-200"}`);
      } else {
        setTestEmailStatus(`Send failed: ${data.error || "Check Gmail credentials"}`);
      }
    } catch (err: any) {
      setTestEmailStatus(`Error: ${err.message}`);
    } finally {
      setIsSendingTestEmail(false);
      setTimeout(() => setTestEmailStatus(null), 5000);
    }
  };

  const handleAddProject = () => {
    if (!newProjectTitle.trim() || !newProjectUrl.trim()) return;
    const item = {
      id: "p-" + Date.now(),
      title: newProjectTitle.trim(),
      url: newProjectUrl.trim(),
      niche: newProjectNiche,
      featured: true,
    };
    setBehanceProjects([...behanceProjects, item]);
    setNewProjectTitle("");
    setNewProjectUrl("");
  };

  const handleDeleteProject = (id: string) => {
    setBehanceProjects(behanceProjects.filter((p) => p.id !== id));
  };

  const handleToggleEmergencyStop = async () => {
    setTogglingSafety(true);
    setSafetyEngineNotice(null);
    try {
      const endpoint = outreachPaused ? "/api/settings/safety/resume" : "/api/settings/safety/emergency-stop";
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setOutreachPaused(!outreachPaused);
        setOperatingMode(outreachPaused ? "TESTING" : "LIVE_PAUSED");
        setSafetyEngineNotice(outreachPaused ? "✓ Safe Testing Mode resumed. Outreach queues unpaused." : "✓ EMERGENCY STOP ENGAGED: All outbound queues paused immediately.");
      }
    } catch (e: any) {
      setSafetyEngineNotice(`Error: ${e.message}`);
    } finally {
      setTogglingSafety(false);
      setTimeout(() => setSafetyEngineNotice(null), 5000);
    }
  };

  const handleToggleBehanceLock = async () => {
    try {
      const res = await fetch("/api/settings/behance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_lock", locked: !isBehanceLocked }),
      });
      const d = await res.json();
      if (d.ok) {
        setIsBehanceLocked(d.isLocked);
        setBehanceNotice(d.isLocked ? "✓ Behance Portfolio is now locked and protected from AI / automation edits." : "Portfolio unlocked. You may edit your profile URL.");
        setTimeout(() => setBehanceNotice(null), 4000);
      }
    } catch (e: any) {
      setBehanceNotice(`Error: ${e.message}`);
    }
  };

  const handleSaveBehanceProfile = async () => {
    try {
      const res = await fetch("/api/settings/behance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_profile", profileUrl: behanceUrl }),
      });
      const d = await res.json();
      if (d.ok) {
        setBehanceUrl(d.profileUrl);
        setIsBehanceLocked(d.isLocked);
        setBehanceNotice("✓ Behance profile URL updated and locked successfully.");
        setTimeout(() => setBehanceNotice(null), 4000);
      } else {
        setBehanceNotice(`Error: ${d.error}`);
      }
    } catch (e: any) {
      setBehanceNotice(`Error: ${e.message}`);
    }
  };

  const handlePairBlackBird = async () => {
    setPairingBB(true);
    setBbNotice(null);
    try {
      const res = await fetch("/api/integrations/blackbird", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pair" }),
      });
      const d = await res.json();
      if (d.ok) {
        setBbPaired(true);
        setBbStatus("CONNECTED");
        if (Array.isArray(d.models)) setBbModels(d.models);
        if (d.preferredModel) setBbPreferredModel(d.preferredModel);
        setBbNotice("✓ Black Bird successfully paired and verified! Models synchronized.");
      } else {
        setBbNotice(`Pairing failed: ${d.error || "Gateway unreachable"}`);
      }
    } catch (e: any) {
      setBbNotice(`Error: ${e.message}`);
    } finally {
      setPairingBB(false);
      setTimeout(() => setBbNotice(null), 5000);
    }
  };

  const handleTestBlackBird = async () => {
    setTestingBB(true);
    setBbNotice(null);
    try {
      const res = await fetch("/api/integrations/blackbird", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const d = await res.json();
      if (d.ok) {
        setBbNotice(`✓ Black Bird inference verified via ${d.modelUsed}! Status 200 OK.`);
      } else {
        setBbNotice(`Test failed: ${d.error}`);
      }
    } catch (e: any) {
      setBbNotice(`Error: ${e.message}`);
    } finally {
      setTestingBB(false);
      setTimeout(() => setBbNotice(null), 5000);
    }
  };

  const handleSetPreferredModel = async (model: string) => {
    setBbPreferredModel(model);
    try {
      await fetch("/api/integrations/blackbird", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_models", preferredModel: model }),
      });
    } catch {}
  };

  const handleSaveServices = async (catalog: any[]) => {
    try {
      const res = await fetch("/api/settings/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_catalog", catalog }),
      });
      const d = await res.json();
      if (d.ok) {
        setServicesCatalog(d.catalog);
        setServicesNotice("✓ Services & pricing catalog saved.");
        setTimeout(() => setServicesNotice(null), 3500);
      }
    } catch (e: any) {
      setServicesNotice(`Error: ${e.message}`);
    }
  };

  const handleSaveAgentSettings = async (updates: Partial<{
    mode: "DRAFT_ONLY" | "SMART_AUTO_REPLY" | "ADVANCED_AUTO_REPLY";
    paused: boolean;
    strictPricingBoundaries: boolean;
    requireHumanApprovalOnNegotiation: boolean;
  }>) => {
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", settings: updates }),
      });
      const d = await res.json();
      if (d.ok) {
        setAgentMode(d.settings.mode);
        setAgentPaused(d.settings.paused);
        setStrictPricing(d.settings.strictPricingBoundaries);
        setRequireNegotiationApproval(d.settings.requireHumanApprovalOnNegotiation);
        setAgentNotice("✓ AI Client Conversation Agent settings updated.");
        setTimeout(() => setAgentNotice(null), 3500);
      }
    } catch (e: any) {
      setAgentNotice(`Error: ${e.message}`);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "email", label: "Email Accounts", icon: Mail },
    { id: "calendar", label: "Google Calendar", icon: Calendar },
    { id: "behance", label: "Behance Vault", icon: FolderHeart },
    { id: "ai", label: "AI Models & Gateways", icon: Sparkles },
    { id: "scrapegraph", label: "Lead Sources (ScrapeGraphAI)", icon: Cpu },
    { id: "services", label: "Services & Pricing", icon: Briefcase },
    { id: "agent", label: "AI Client Agent", icon: Bot },
    { id: "automation", label: "Automation", icon: Clock },
    { id: "safety", label: "Safety & Testing Mode", icon: Shield },
    { id: "suppression", label: "Suppression & Data", icon: AlertCircle },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ======================================================== */}
      {/* 1. COMPACT SETTINGS HEADER                               */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-xs text-[#888888] mt-0.5">
            Manage your verified sender identity, integrations, Behance proof, and automation preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={loading}
          className="rounded-[6px] bg-[#10B981] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#059669] inline-flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
        >
          <Save className="size-3.5" />
          <span>{loading ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/25 text-xs text-[#10B981] flex items-center justify-between">
          <span>{savedNotice}</span>
          <button onClick={() => setSavedNotice(null)} className="text-[#888888] hover:text-white">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. RESPONSIVE COMPACT TABS                               */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#141414] p-1 rounded-lg border border-[#222222] text-xs">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] font-medium transition ${
                isActive
                  ? "bg-[#222222] text-white shadow-sm font-semibold"
                  : "text-[#888888] hover:text-[#CCCCCC]"
              }`}
            >
              <Icon className={`size-3.5 ${isActive ? "text-[#10B981]" : "text-[#777777]"}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. TAB 1: BUSINESS & SENDER PROFILE                     */}
      {/* ======================================================== */}
      {activeTab === "profile" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-4">
          <div className="border-b border-[#1E1E1E] pb-3">
            <h2 className="text-sm font-semibold text-white">Sender & Business Identity</h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Used in every generated email and Gemini prompt. Miracle will never invent or alter your real name.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Your Sender Name * (Actual Name)
              </label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => handleSenderNameChange(e.target.value)}
                placeholder="e.g. Zohaib"
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
              />
              <span className="text-[10px] text-[#666666] mt-0.5 block">
                Never replaces with fictional roles like &quot;Creative Studio Lead&quot;.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Business / Studio Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Miracle Creative Studio"
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="zohaibaidesigner@gmail.com"
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
              >
                <option value="America/New_York">Eastern Time (America/New_York)</option>
                <option value="America/Chicago">Central Time (America/Chicago)</option>
                <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
                <option value="Europe/London">London (GMT / BST)</option>
                <option value="Asia/Dubai">Dubai (GST +4)</option>
                <option value="Asia/Karachi">Pakistan (PKT +5)</option>
                <option value="Asia/Kolkata">India (IST +5:30)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#888888] block mb-1">
              Services Offered
            </label>
            <input
              type="text"
              value={servicesOffered}
              onChange={(e) => setServicesOffered(e.target.value)}
              placeholder="e.g. Graphic Design, Brand Identity & High-Converting Video Editing"
              className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#888888]">
                Email Signature (Automatically Appended to All Pitches)
              </label>
              <span className="text-[10px] text-[#10B981] font-mono">
                Live Signature
              </span>
            </div>
            <textarea
              rows={3}
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
              className="input bg-[#181818] border-[#262626] text-xs font-mono text-white p-3 leading-relaxed"
            />
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 4. TAB 2: EMAIL ACCOUNTS & DELIVERABILITY                */}
      {/* ======================================================== */}
      {activeTab === "email" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-4">
          <div className="border-b border-[#1E1E1E] pb-3">
            <h2 className="text-sm font-semibold text-white">Email Connection & SMTP</h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Send cold emails directly through your authenticated Gmail or custom SMTP account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Connected Email Address
              </label>
              <input
                type="email"
                value={connectedEmail}
                onChange={(e) => setConnectedEmail(e.target.value)}
                placeholder="zohaibaidesigner@gmail.com"
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Gmail App Password (16 Characters)
              </label>
              <PasswordInput
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#888888] block mb-1">
              Daily Outbound Limit
            </label>
            <select
              value={dailySendLimit}
              onChange={(e) => setDailySendLimit(Number(e.target.value))}
              className="input bg-[#181818] border-[#262626] text-xs text-white h-9 w-full sm:w-64"
            >
              <option value="25">25 emails / day (Warm-up safety)</option>
              <option value="50">50 emails / day (Standard)</option>
              <option value="100">100 emails / day (High volume)</option>
            </select>
          </div>

          {/* Test Email Row */}
          <div className="pt-3 border-t border-[#1E1E1E] space-y-2">
            <span className="text-[11px] font-semibold text-[#888888] block">
              Deliverability Health Check
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="test@domain.com"
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9 flex-1"
              />
              <button
                type="button"
                onClick={handleTestSendEmail}
                disabled={isSendingTestEmail}
                className="rounded-[6px] bg-[#1E1E1E] border border-[#2E2E2E] px-4 h-9 text-xs font-medium text-white hover:bg-[#252525] inline-flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
              >
                <Send className="size-3 text-[#10B981]" />
                <span>{isSendingTestEmail ? "Sending..." : "Send Test Email"}</span>
              </button>
            </div>
            {testEmailStatus && (
              <p className="text-xs text-[#10B981] mt-1">{testEmailStatus}</p>
            )}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 5. TAB 3: GOOGLE CALENDAR & MEET                         */}
      {/* ======================================================== */}
      {activeTab === "calendar" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="size-4 text-[#10B981]" />
                Google Calendar & Meet Sync
              </h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Real two-way sync with Google Calendar API and Google Meet link generation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {calendarStatus === "CONNECTED" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/15 px-2.5 py-0.5 text-xs font-semibold text-[#10B981] border border-[#10B981]/30">
                  <CheckCircle2 className="size-3" />
                  Connected & Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/15 px-2.5 py-0.5 text-xs font-semibold text-[#F59E0B] border border-[#F59E0B]/30">
                  <AlertCircle className="size-3" />
                  Authorization Required
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Connected Google Account
              </label>
              <input
                type="text"
                value={calendarEmail || "zohaibaidesigner@gmail.com"}
                onChange={(e) => setCalendarEmail(e.target.value)}
                placeholder="Google email..."
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Selected Calendar
              </label>
              <input
                type="text"
                value={selectedCalendarName}
                onChange={(e) => setSelectedCalendarName(e.target.value)}
                placeholder="e.g. Primary Google Calendar"
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#888888]">
                Appointment Booking Page URL (Optional)
              </label>
              {bookingUrl && (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1"
                >
                  <span>Test URL</span>
                  <ExternalLink className="size-2.5" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/u/0/appointments/schedules/..."
              className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
            />
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestCalendar}
              disabled={testingCalendar}
              className="rounded-[6px] bg-[#1E1E1E] border border-[#2E2E2E] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#252525] inline-flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${testingCalendar ? "animate-spin text-[#10B981]" : "text-[#888888]"}`} />
              <span>{testingCalendar ? "Verifying..." : "Test Calendar Health"}</span>
            </button>

            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[6px] border border-[#262626] bg-[#181818] px-3.5 py-1.5 text-xs text-[#CCCCCC] hover:text-white inline-flex items-center gap-1 transition"
            >
              <span>Open Google Calendar UI</span>
              <ExternalLink className="size-3 text-[#777777]" />
            </a>

            <button
              type="button"
              onClick={() => setShowCalendarDetails(!showCalendarDetails)}
              className="text-xs text-[#777777] hover:text-white underline ml-auto"
            >
              {showCalendarDetails ? "Hide Technical Details" : "Show Technical Details"}
            </button>
          </div>

          {calendarTestNotice && (
            <div className="p-3 rounded-[6px] bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-[#E5E5E5]">
              {calendarTestNotice}
            </div>
          )}

          {showCalendarDetails && (
            <div className="p-3 rounded-[8px] bg-[#151515] border border-[#222222] text-xs font-mono space-y-1 text-[#888888]">
              <div>Target Calendar ID: <span className="text-white">{selectedCalendarId}</span></div>
              <div>Scopes: <span className="text-[#38BDF8]">https://www.googleapis.com/auth/calendar.events</span></div>
              <div>Direct Web Render: <span className="text-[#10B981]">Enabled</span></div>
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* 6. TAB 4: BEHANCE VAULT (IMMUTABLE AUTHORITATIVE PROOF)  */}
      {/* ======================================================== */}
      {activeTab === "behance" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FolderHeart className="size-4 text-[#10B981]" />
                Behance Portfolio Vault
              </h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Single authoritative personal profile URL. Locked against AI overwrites and external resets.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isBehanceLocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/15 px-3 py-1 text-xs font-semibold text-[#10B981] border border-[#10B981]/30">
                  <Lock className="size-3" />
                  Status: Saved &amp; Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F59E0B]/15 px-3 py-1 text-xs font-semibold text-[#F59E0B] border border-[#F59E0B]/30">
                  <Unlock className="size-3" />
                  Unlocked (Editing Mode)
                </span>
              )}
            </div>
          </div>

          {behanceNotice && (
            <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/25 text-xs text-[#10B981]">
              {behanceNotice}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#888888]">
                Primary Authoritative Behance Profile URL *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleBehanceLock}
                  className={`text-xs inline-flex items-center gap-1 font-medium transition ${
                    isBehanceLocked ? "text-[#F59E0B] hover:text-[#D97706]" : "text-[#10B981] hover:text-[#059669]"
                  }`}
                >
                  {isBehanceLocked ? (
                    <>
                      <Unlock className="size-3" />
                      <span>Unlock to Edit Profile</span>
                    </>
                  ) : (
                    <>
                      <Lock className="size-3" />
                      <span>Lock Portfolio (Recommended)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="url"
                required
                disabled={isBehanceLocked}
                value={behanceUrl}
                onChange={(e) => setBehanceUrl(e.target.value)}
                placeholder="https://www.behance.net/your-username"
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9 flex-1 disabled:opacity-60 disabled:cursor-not-allowed font-mono"
              />

              {!isBehanceLocked && (
                <button
                  type="button"
                  onClick={handleSaveBehanceProfile}
                  className="rounded-[6px] bg-[#10B981] px-3.5 h-9 text-xs font-semibold text-black hover:bg-[#0EA5E9] inline-flex items-center gap-1 shrink-0"
                >
                  <Save className="size-3" />
                  <span>Save &amp; Lock</span>
                </button>
              )}

              {behanceUrl && (
                <a
                  href={behanceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[6px] border border-[#2E2E2E] bg-[#1A1A1A] px-3 h-9 text-xs text-white inline-flex items-center gap-1 hover:bg-[#252525] shrink-0"
                >
                  <span>Open Profile</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <p className="text-[10px] text-[#71717A] mt-1">
              Must be your author profile URL (e.g., https://www.behance.net/username). Specific case studies are managed below.
            </p>
          </div>

          {/* Featured Case Studies */}
          <div className="pt-3 border-t border-[#1E1E1E] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Niche-Matched Behance Case Studies ({behanceProjects.length})
              </span>
            </div>

            <div className="space-y-2">
              {behanceProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-[8px] bg-[#181818] border border-[#262626] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{p.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#777777] mt-0.5">
                      <span className="text-[#10B981] font-mono">{p.niche}</span>
                      <span>&bull;</span>
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:underline truncate">
                        {p.url}
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(p.id)}
                    className="text-[#666666] hover:text-[#EF4444] p-1"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Project Form */}
            <div className="p-3 rounded-[8px] bg-[#161616] border border-[#222222] space-y-2">
              <span className="text-[11px] font-semibold text-[#888888] block">Add Niche Project</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="Case Study Title"
                  className="input bg-[#1E1E1E] border-[#2A2A2A] text-xs text-white h-8"
                />
                <input
                  type="url"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  placeholder="https://www.behance.net/gallery/..."
                  className="input bg-[#1E1E1E] border-[#2A2A2A] text-xs text-white h-8"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newProjectNiche}
                    onChange={(e) => setNewProjectNiche(e.target.value)}
                    placeholder="Target Niche (e.g. Real Estate)"
                    className="input bg-[#1E1E1E] border-[#2A2A2A] text-xs text-white h-8 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="rounded-[6px] bg-[#10B981] px-3 h-8 text-xs font-semibold text-white hover:bg-[#059669] shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 7. TAB 5: AI MODELS & GATEWAYS (BLACK BIRD + GEMINI)      */}
      {/* ======================================================== */}
      {activeTab === "ai" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-5">
          <div className="border-b border-[#1E1E1E] pb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="size-4 text-[#10B981]" />
              AI Routing Gateway &amp; Model Engine
            </h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Dual-engine intelligence: seamlessly connect to Black Bird AI Gateway or use direct Gemini API.
            </p>
          </div>

          {bbNotice && (
            <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/25 text-xs text-[#10B981]">
              {bbNotice}
            </div>
          )}

          {/* Provider Toggle */}
          <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-4 space-y-3">
            <span className="text-[11px] font-semibold text-[#888888] block">Primary AI Engine Selection</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-[8px] border cursor-pointer transition flex items-center gap-3 ${
                  aiProvider === "blackbird"
                    ? "bg-[#10B981]/10 border-[#10B981]/50 text-white"
                    : "bg-[#181818] border-[#2A2A2A] text-[#888888] hover:border-[#38BDF8]/40"
                }`}
              >
                <input
                  type="radio"
                  name="ai_provider"
                  checked={aiProvider === "blackbird"}
                  onChange={() => setAiProvider("blackbird")}
                  className="accent-[#10B981]"
                />
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <span>Black Bird AI Gateway</span>
                    <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.2 rounded font-mono">
                      Port 20129
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Unified multi-model hub routing via local OpenAI-compatible API.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-[8px] border cursor-pointer transition flex items-center gap-3 ${
                  aiProvider === "gemini"
                    ? "bg-[#10B981]/10 border-[#10B981]/50 text-white"
                    : "bg-[#181818] border-[#2A2A2A] text-[#888888] hover:border-[#38BDF8]/40"
                }`}
              >
                <input
                  type="radio"
                  name="ai_provider"
                  checked={aiProvider === "gemini"}
                  onChange={() => setAiProvider("gemini")}
                  className="accent-[#10B981]"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Direct Gemini API</div>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Direct Google AI Studio integration for ultra-fast fallback generation.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Black Bird Gateway Card */}
          <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202020] pb-3">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="size-3.5 text-[#38BDF8]" />
                  <span>Black Bird Connection Hub</span>
                </h3>
                <span className="text-[11px] text-[#71717A] font-mono">{bbEndpoint}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                    bbStatus === "CONNECTED"
                      ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                      : "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${bbStatus === "CONNECTED" ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
                  {bbStatus === "CONNECTED" ? "Gateway Online & Connected" : "Disconnected"}
                </span>

                <button
                  type="button"
                  onClick={handlePairBlackBird}
                  disabled={pairingBB}
                  className="rounded-[6px] bg-[#10B981] px-3 py-1 text-xs font-semibold text-black hover:bg-[#0EA5E9] transition disabled:opacity-50"
                >
                  {pairingBB ? "Pairing..." : bbPaired ? "Re-Sync Models" : "Pair with Black Bird"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                  Preferred Black Bird Model
                </label>
                <select
                  value={bbPreferredModel}
                  onChange={(e) => handleSetPreferredModel(e.target.value)}
                  className="input bg-[#181818] border-[#262626] text-xs text-white h-9 w-full font-mono"
                >
                  {bbModels.length > 0 ? (
                    bbModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="gemini-cli/gemini-2.0-flash">gemini-cli/gemini-2.0-flash</option>
                      <option value="openai-codex/gpt-4o">openai-codex/gpt-4o</option>
                      <option value="groq/llama-3.3-70b-versatile">groq/llama-3.3-70b-versatile</option>
                    </>
                  )}
                </select>
                <span className="text-[10px] text-[#71717A] mt-1 block">
                  Synchronized dynamically from Black Bird model registry.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                  Inference Verification
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestBlackBird}
                    disabled={testingBB}
                    className="rounded-[6px] bg-[#1E1E1E] border border-[#2E2E2E] px-4 h-9 text-xs font-medium text-white hover:bg-[#252525] inline-flex items-center gap-1.5 transition disabled:opacity-50 flex-1 justify-center"
                  >
                    <RefreshCw className={`size-3 ${testingBB ? "animate-spin text-[#10B981]" : "text-[#888888]"}`} />
                    <span>{testingBB ? "Sending prompt..." : "Test Black Bird Inference"}</span>
                  </button>
                </div>
                <span className="text-[10px] text-[#71717A] mt-1 block">
                  Sends live completion test to port 20129 and verifies response structure.
                </span>
              </div>
            </div>
          </div>

          {/* Direct Gemini Configuration */}
          <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-4 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-[#202020] pb-2">
              <Sparkles className="size-3.5 text-[#10B981]" />
              <span>Direct Google Gemini Backup</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[#888888]">
                    Gemini API Key (Google AI Studio)
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
                <PasswordInput
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="input bg-[#181818] border-[#262626] text-xs text-white h-9 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                  Gemini Model Profile
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="input bg-[#181818] border-[#262626] text-xs text-white h-9 w-full"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast &amp; Reliable)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Audit Analysis)</option>
                </select>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={testingGemini}
                className="rounded-[6px] bg-[#1E1E1E] border border-[#2E2E2E] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#252525] inline-flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Sparkles className="size-3 text-[#10B981]" />
                <span>{testingGemini ? "Testing..." : "Test Gemini Connection"}</span>
              </button>

              {geminiStatus && (
                <span className="text-xs text-[#10B981] font-mono">{geminiStatus}</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 7.5 TAB: SCRAPEGRAPHAI LEAD DISCOVERY PROVIDER          */}
      {/* ======================================================== */}
      {activeTab === "scrapegraph" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="size-4 text-[#10B981]" />
                ScrapeGraphAI Search &amp; Web Discovery
              </h2>
              <p className="text-xs text-[#888888] mt-0.5">
                AI-powered live web search and structured company extraction when local directories are exhausted.
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${
                scrapeGraphStatus === "CONNECTED"
                  ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                  : scrapeGraphStatus === "CONFIGURED"
                  ? "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30"
                  : scrapeGraphStatus === "ERROR"
                  ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                  : "bg-[#71717A]/15 text-[#A1A1AA] border-[#71717A]/30"
              }`}
            >
              ● {scrapeGraphStatus}
            </span>
          </div>

          {scrapeGraphNotice && (
            <div
              className={`p-3 rounded-[8px] border text-xs flex items-center justify-between ${
                scrapeGraphNotice.startsWith("✓")
                  ? "bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]"
                  : "bg-[#EF4444]/10 border-[#EF4444]/25 text-[#EF4444]"
              }`}
            >
              <span>{scrapeGraphNotice}</span>
              <button
                type="button"
                onClick={() => setScrapeGraphNotice(null)}
                className="text-[#888888] hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Configuration Form */}
          <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-4 space-y-4">
            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#CCCCCC] flex items-center justify-between">
                <span>ScrapeGraphAI API Key</span>
                <a
                  href="https://dashboard.scrapegraphai.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#10B981] hover:underline inline-flex items-center gap-1 font-mono"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="size-3" />
                </a>
              </label>
              <PasswordInput
                value={scrapeGraphApiKey}
                onChange={(e) => setScrapeGraphApiKey(e.target.value)}
                placeholder="sgai-..."
                className="w-full bg-[#181818] border-[#2A2A2A] text-white text-xs font-mono"
              />
              <p className="text-[11px] text-[#71717A]">
                Requires a valid ScrapeGraphAI account. Enables real-time web discovery across Riyadh and global cities.
              </p>
            </div>

            {/* Enable Provider Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[#222222]">
              <div>
                <span className="text-xs font-medium text-white block">Enable Live Web Discovery</span>
                <p className="text-[11px] text-[#71717A]">
                  Automatically search and extract candidate businesses online when directory leads are exhausted.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={scrapeGraphEnabled}
                  onChange={(e) => setScrapeGraphEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#27272A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
              </label>
            </div>

            {/* Max Credits per Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#222222]">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#CCCCCC]">Max Credits per Discovery Run</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={scrapeGraphMaxCredits}
                  onChange={(e) => setScrapeGraphMaxCredits(Number(e.target.value) || 10)}
                  className="w-full rounded-[6px] bg-[#181818] border border-[#2A2A2A] px-3 py-1.5 text-xs text-white"
                />
                <span className="text-[10px] text-[#71717A]">Protects against accidental quota overconsumption.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#CCCCCC]">ScrapeGraph Account Balance</label>
                <div className="p-2 rounded-[6px] bg-[#181818] border border-[#2A2A2A] text-xs font-mono text-[#38BDF8] flex items-center justify-between">
                  <span>Remaining Credits:</span>
                  <span className="font-bold text-white">
                    {scrapeGraphCreditsRemaining !== null ? scrapeGraphCreditsRemaining : "Not checked yet"}
                  </span>
                </div>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="pt-3 border-t border-[#222222] flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestScrapeGraph}
                disabled={isTestingScrapeGraph || !scrapeGraphApiKey}
                className="rounded-[6px] bg-[#1E1E1E] border border-[#2E2E2E] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#2A2A2A] inline-flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isTestingScrapeGraph ? (
                  <RefreshCw className="size-3 animate-spin text-[#10B981]" />
                ) : (
                  <Sparkles className="size-3 text-[#10B981]" />
                )}
                <span>{isTestingScrapeGraph ? "Verifying API..." : "Test Connection & Check Credits"}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 8. TAB 6: SERVICES & PRICING ENGINE                      */}
      {/* ======================================================== */}
      {activeTab === "services" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Briefcase className="size-4 text-[#10B981]" />
                Services &amp; Deterministic Pricing Catalog
              </h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Deterministic price policies, deliverables, revisions, and advance deposit requirements.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSaveServices(servicesCatalog)}
              className="rounded-[6px] bg-[#10B981] px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-[#0EA5E9] inline-flex items-center gap-1.5"
            >
              <Save className="size-3" />
              <span>Save Catalog</span>
            </button>
          </div>

          {servicesNotice && (
            <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/25 text-xs text-[#10B981]">
              {servicesNotice}
            </div>
          )}

          <div className="space-y-3">
            {servicesCatalog.map((svc, idx) => (
              <div
                key={svc.key || idx}
                className="p-4 rounded-[8px] bg-[#161616] border border-[#222222] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202020] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{svc.name}</span>
                    <span className="text-[10px] bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded font-mono">
                      ${svc.minPrice} &ndash; ${svc.maxPrice} USD
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A1A1AA]">
                    {svc.includedRevisions} Revisions &bull; {svc.advancePercent}% Advance
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-[#71717A] uppercase block mb-1">Min Price ($)</label>
                    <input
                      type="number"
                      value={svc.minPrice}
                      onChange={(e) => {
                        const next = [...servicesCatalog];
                        next[idx].minPrice = Number(e.target.value);
                        setServicesCatalog(next);
                      }}
                      className="input bg-[#1E1E1E] border-[#2A2A2A] text-xs text-white h-8"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#71717A] uppercase block mb-1">Max Price ($)</label>
                    <input
                      type="number"
                      value={svc.maxPrice}
                      onChange={(e) => {
                        const next = [...servicesCatalog];
                        next[idx].maxPrice = Number(e.target.value);
                        setServicesCatalog(next);
                      }}
                      className="input bg-[#1E1E1E] border-[#2A2A2A] text-xs text-white h-8"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#71717A] uppercase block mb-1">Revisions</label>
                    <input
                      type="number"
                      value={svc.includedRevisions}
                      onChange={(e) => {
                        const next = [...servicesCatalog];
                        next[idx].includedRevisions = Number(e.target.value);
                        setServicesCatalog(next);
                      }}
                      className="input bg-[#1E1E1E] border-[#2A2A2A] text-xs text-white h-8"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#71717A] uppercase block mb-1">Advance Deposit %</label>
                    <input
                      type="number"
                      value={svc.advancePercent}
                      onChange={(e) => {
                        const next = [...servicesCatalog];
                        next[idx].advancePercent = Number(e.target.value);
                        setServicesCatalog(next);
                      }}
                      className="input bg-[#1E1E1E] border-[#2A2A2A] text-xs text-white h-8"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#888888] pt-1">
                  Deliverables: <span className="text-[#CCCCCC]">{svc.deliverables?.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 9. TAB 7: AI CLIENT CONVERSATION AGENT                    */}
      {/* ======================================================== */}
      {activeTab === "agent" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bot className="size-4 text-[#10B981]" />
                AI Client Conversation &amp; Negotiation Agent
              </h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Handles prospect replies, qualifies requirements, handles budget negotiations, and proposes meetings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                  agentPaused
                    ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                    : "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                }`}
              >
                <span className={`size-1.5 rounded-full ${agentPaused ? "bg-[#EF4444]" : "bg-[#10B981]"}`} />
                {agentPaused ? "Agent Paused" : `Active: ${agentMode}`}
              </span>
            </div>
          </div>

          {agentNotice && (
            <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/25 text-xs text-[#10B981]">
              {agentNotice}
            </div>
          )}

          {/* Mode Selector */}
          <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-4 space-y-3">
            <span className="text-[11px] font-semibold text-[#888888] block">AI Response Mode</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "DRAFT_ONLY",
                  title: "Draft Only (Recommended)",
                  desc: "Generates suggested replies in CRM drawer for your 1-click review and approval.",
                },
                {
                  id: "SMART_AUTO_REPLY",
                  title: "Smart Auto-Reply",
                  desc: "Automatically responds to common queries (portfolio, services, booking); holds negotiations for review.",
                },
                {
                  id: "ADVANCED_AUTO_REPLY",
                  title: "Advanced Autonomous",
                  desc: "Autonomously replies and negotiates within strict pricing boundaries.",
                },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSaveAgentSettings({ mode: m.id as any })}
                  className={`p-3.5 rounded-[8px] border cursor-pointer transition ${
                    agentMode === m.id
                      ? "bg-[#10B981]/10 border-[#10B981]/50 text-white"
                      : "bg-[#181818] border-[#2A2A2A] text-[#888888] hover:border-[#38BDF8]/40"
                  }`}
                >
                  <div className="font-semibold text-xs text-white mb-1">{m.title}</div>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Toggles */}
          <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-4 space-y-3">
            <span className="text-[11px] font-semibold text-[#888888] block">Negotiation &amp; Safety Guards</span>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={strictPricing}
                onChange={(e) => handleSaveAgentSettings({ strictPricingBoundaries: e.target.checked })}
                className="size-3.5 accent-[#10B981] rounded"
              />
              <span className="text-xs text-[#CCCCCC]">
                Strict Pricing Boundaries: Refuse quotes below catalog minimums (e.g. Logo Design minimum $5).
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireNegotiationApproval}
                onChange={(e) => handleSaveAgentSettings({ requireHumanApprovalOnNegotiation: e.target.checked })}
                className="size-3.5 accent-[#10B981] rounded"
              />
              <span className="text-xs text-[#CCCCCC]">
                Require Human Review on Custom Budget Requests &amp; Out-of-Policy Inquiries.
              </span>
            </label>
          </div>

          {/* Emergency Pause Control */}
          <div className="rounded-[8px] border border-[#2A2A2A] bg-[#161616] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <AlertCircle className={`size-4 ${agentPaused ? "text-[#EF4444]" : "text-[#F59E0B]"}`} />
                <span>Agent Emergency Override</span>
              </h3>
              <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                Immediately halt all automated client message processing and auto-replies across all active conversations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSaveAgentSettings({ paused: !agentPaused })}
              className={`rounded-[6px] px-4 py-2 text-xs font-semibold shrink-0 transition ${
                agentPaused ? "bg-[#10B981] text-black hover:bg-[#0EA5E9]" : "bg-[#EF4444] text-white hover:bg-[#DC2626]"
              }`}
            >
              {agentPaused ? "Resume AI Agent" : "Emergency Pause Agent"}
            </button>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 8. TAB 6: AUTOMATION & SAFETY                            */}
      {/* ======================================================== */}
      {activeTab === "automation" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-4">
          <div className="border-b border-[#1E1E1E] pb-3">
            <h2 className="text-sm font-semibold text-white">Automation Safety & Suppression</h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Prevent spam flags, stop sequences on prospect replies, and respect suppressions.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stopOnReply}
                onChange={(e) => setStopOnReply(e.target.checked)}
                className="size-3.5 accent-[#10B981] rounded"
              />
              <span className="text-xs text-[#CCCCCC]">
                Auto-suppress follow-ups immediately when a lead replies
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stopOnMeeting}
                onChange={(e) => setStopOnMeeting(e.target.checked)}
                className="size-3.5 accent-[#10B981] rounded"
              />
              <span className="text-xs text-[#CCCCCC]">
                Auto-suppress follow-ups when a Google Calendar meeting is booked
              </span>
            </label>
          </div>

          <div className="pt-2">
            <label className="text-[11px] font-semibold text-[#888888] block mb-1">
              Do Not Contact (DNC) Domains / Emails (One per line)
            </label>
            <textarea
              rows={4}
              value={dncList}
              onChange={(e) => setDncList(e.target.value)}
              className="input bg-[#181818] border-[#262626] text-xs font-mono text-white p-3 leading-relaxed"
            />
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 9. TAB 7: OUTREACH SAFETY & LIVE GATE                    */}
      {/* ======================================================== */}
      {activeTab === "safety" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="size-4 text-[#10B981]" />
                Testing Mode & Outreach Safety Engine
              </h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Dual-gate safety architecture: default is dry-run testing mode. Real outreach requires environment unlock and manual live activation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider font-semibold border ${
                  outreachPaused
                    ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                    : operatingMode === "LIVE_ACTIVE"
                    ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                    : "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    outreachPaused
                      ? "bg-[#EF4444]"
                      : operatingMode === "LIVE_ACTIVE"
                      ? "bg-[#10B981] animate-pulse"
                      : "bg-[#38BDF8]"
                  }`}
                />
                <span>{outreachPaused ? "Outreach Paused" : operatingMode === "TESTING" ? "Testing Mode (Dry-Run)" : "Live Outreach"}</span>
              </span>
            </div>
          </div>

          {safetyEngineNotice && (
            <div className="p-3 rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/25 text-xs text-[#10B981]">
              {safetyEngineNotice}
            </div>
          )}

          {/* Emergency Stop Control */}
          <div className="rounded-[8px] border border-[#2A2A2A] bg-[#161616] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <AlertCircle className={`size-4 ${outreachPaused ? "text-[#EF4444]" : "text-[#F59E0B]"}`} />
                <span>Emergency Stop Control</span>
              </h3>
              <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                Immediately pauses all outbound email queues and follow-ups while keeping reply monitoring and calendar synchronization active.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleEmergencyStop}
              disabled={togglingSafety}
              className={`rounded-[6px] px-4 py-2 text-xs font-semibold shrink-0 transition ${
                outreachPaused
                  ? "bg-[#10B981] text-black hover:bg-[#0EA5E9]"
                  : "bg-[#EF4444] text-white hover:bg-[#DC2626]"
              }`}
            >
              {outreachPaused ? "Resume Outreach (Safe Testing Mode)" : "Pause All Outreach"}
            </button>
          </div>

          {/* Approved Test Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Approved Personal Test Address (Permitted in Testing Mode)
              </label>
              <input
                type="email"
                value={approvedTestRecipient}
                onChange={(e) => setApprovedTestRecipient(e.target.value)}
                placeholder="zohaibaidesigner@gmail.com"
                className="input bg-[#181818] border-[#262626] text-xs text-white h-9"
              />
              <span className="text-[10px] text-[#71717A] mt-1 block">
                In Testing Mode, only emails sent to this verified address will actually be transmitted via SMTP.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                Environment Safety Flag (Dual-Gate)
              </label>
              <div className="input bg-[#181818] border-[#262626] text-xs text-[#A1A1AA] h-9 flex items-center font-mono">
                ENABLE_OUTBOUND_LIVE_SEND=&quot;false&quot; (Locked Safe)
              </div>
              <span className="text-[10px] text-[#71717A] mt-1 block">
                Server deployment lock ensures zero real outreach without an explicit production flag.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 10. TAB 8: SUPPRESSION REGISTRY & LEAD BIN               */}
      {/* ======================================================== */}
      {activeTab === "suppression" && (
        <section className="rounded-[10px] border border-[#202020] bg-[#121212] p-5 space-y-4">
          <div className="border-b border-[#1E1E1E] pb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="size-4 text-[#10B981]" />
              HMAC Suppression Registry & Lifecycle Memory
            </h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Persistent memory prevents re-contacting prospects across sessions, even after deleting leads.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-3 text-center">
              <span className="text-[10px] text-[#71717A] block uppercase font-mono">Active CRM Leads</span>
              <span className="text-lg font-bold text-white mt-1 block">{suppressionStats.activeLeads}</span>
            </div>
            <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-3 text-center">
              <span className="text-[10px] text-[#71717A] block uppercase font-mono">Follow-up Due</span>
              <span className="text-lg font-bold text-[#F59E0B] mt-1 block">3-Day Trigger</span>
            </div>
            <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-3 text-center">
              <span className="text-[10px] text-[#71717A] block uppercase font-mono">Archived (7-Day)</span>
              <span className="text-lg font-bold text-[#818CF8] mt-1 block">{suppressionStats.archivedLeads}</span>
            </div>
            <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-3 text-center">
              <span className="text-[10px] text-[#71717A] block uppercase font-mono">Lead Bin</span>
              <span className="text-lg font-bold text-[#EF4444] mt-1 block">{suppressionStats.binLeads}</span>
            </div>
          </div>

          <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-4 space-y-2 text-xs">
            <h3 className="font-semibold text-white">Suppression Invariants Enforced:</h3>
            <ul className="space-y-1 text-[#A1A1AA] list-disc list-inside">
              <li>Every contacted domain is fingerprinted using SHA-256 HMAC and blocked from duplicate discovery.</li>
              <li>Leads with no replies after follow-up are automatically archived after 7 days to keep your pipeline clean.</li>
              <li>Permanently deleting a lead preserves their suppression hash so they are never contacted again.</li>
              <li>Leads who reply, express interest, or schedule a Google Meet are permanently protected from auto-archival.</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
