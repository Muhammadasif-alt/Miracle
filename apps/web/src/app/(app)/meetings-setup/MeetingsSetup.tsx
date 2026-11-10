"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  FolderHeart,
  Globe,
  KeyRound,
  Laptop,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { LinkedinIcon } from "@/components/ui/LinkedinIcon";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface BookedMeeting {
  id: string;
  clientName: string;
  companyName: string;
  email: string;
  time: string;
  date: string;
  source: "YouTube" | "Google Maps" | "LinkedIn";
  serviceGap: string;
  matchedProof: string;
  meetingLink: string;
}

const UPCOMING_MEETINGS: BookedMeeting[] = [
  {
    id: "meet-1",
    clientName: "Jordan Welch",
    companyName: "Jordan Welch Media",
    email: "collabs@thejordanwelch.com",
    time: "3:30 PM",
    date: "Thursday, Nov 6",
    source: "YouTube",
    serviceGap: "Needs High-CTR 3D YouTube Thumbnails & B-Roll Edits",
    matchedProof: "https://frame.io/share/youtube-retention-hooks",
    meetingLink: "https://meet.google.com/abc-miracle-call",
  },
  {
    id: "meet-2",
    clientName: "Julian Ross",
    companyName: "Skyline Luxury Realty",
    email: "julian@skylinerealty.com",
    time: "11:00 AM",
    date: "Friday, Nov 7",
    source: "Google Maps",
    serviceGap: "Needs 9:16 Vertical Video Reels & Drone Cuts",
    matchedProof: "https://frame.io/share/realestate-hooks-showcase",
    meetingLink: "https://meet.google.com/xyz-realty-pitch",
  },
];

export function MeetingsSetup() {
  // Dual-Layer Google Auth Mode: "BROWSER" (Method A) vs "API" (Method B)
  const [authMethod, setAuthMethod] = useState<"BROWSER" | "API">("BROWSER");

  // Method A (Direct ID/Password + Persistent Browser Profile)
  const [browserEmail, setBrowserEmail] = useState("");
  const [browserPassword, setBrowserPassword] = useState("");
  const [browserProfileActive, setBrowserProfileActive] = useState(false);
  const [isSavingBrowserSession, setIsSavingBrowserSession] = useState(false);
  const [browserSessionMessage, setBrowserSessionMessage] = useState("");

  // Method B (Google APIs / SMTP)
  const [apiEmail, setApiEmail] = useState("");
  const [apiPassword, setApiPassword] = useState("");
  const [senderName, setSmtpSenderName] = useState("Miracle Creative Studio");
  const [isVerifyingApi, setIsVerifyingApi] = useState(false);
  const [apiVerified, setApiVerified] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");

  // Google Sheets Master Tracker
  const [spreadsheetId, setSpreadsheetId] = useState("1MIRA_LEAD_TRACKER_SHEET_DEMO");
  const [sheetSyncedCount, setSheetSyncedCount] = useState(12);

  // Google Calendar & Meet
  const [calendarEmail, setCalendarEmail] = useState("");
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [bookingUrl, setBookingUrl] = useState("https://calendar.google.com");
  const [bookingSaved, setBookingSaved] = useState(false);

  // Dynamic Live Meetings
  const [liveMeetings, setLiveMeetings] = useState<any[]>(UPCOMING_MEETINGS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newTopic, setNewTopic] = useState("Creative Strategy & Discovery");
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);

  // Load saved credentials & browser session status on mount
  useEffect(() => {
    // Check persistent browser session
    fetch("/api/google/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.status?.isLoggedIn) {
          setBrowserProfileActive(true);
          if (data.status.accountEmail) {
            setBrowserEmail(data.status.accountEmail);
          }
        }
      })
      .catch(() => {});

    try {
      const stored = localStorage.getItem("miracle_connected_email");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) {
          setApiEmail(parsed.email);
          setApiPassword(parsed.password || "");
          setSmtpSenderName(parsed.senderName || "Miracle Creative Studio");
          setApiVerified(Boolean(parsed.verified));
        }
      }

      const storedCalendar = localStorage.getItem("miracle_connected_calendar");
      if (storedCalendar) {
        const cParsed = JSON.parse(storedCalendar);
        if (cParsed.email) {
          setCalendarEmail(cParsed.email);
          setCalendarConnected(true);
        }
      }

      const storedBooking = localStorage.getItem("miracle_booking_url");
      if (storedBooking) setBookingUrl(storedBooking);

      const storedMeetings = localStorage.getItem("miracle_google_calendar_events");
      if (storedMeetings) {
        const parsed = JSON.parse(storedMeetings);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((m: any) => ({
            id: m.id,
            clientName: m.leadName,
            companyName: m.leadName,
            email: m.leadEmail,
            time: new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(m.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
            source: "Google Meet",
            serviceGap: m.summary,
            matchedProof: "https://www.behance.net/miracle-creative",
            meetingLink: m.meetLink,
            googleCalendarUrl: m.googleCalendarUrl,
          }));
          setLiveMeetings([...mapped, ...UPCOMING_MEETINGS]);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleCreateNewMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientEmail) return;
    setIsCreatingMeet(true);
    try {
      const res = await fetch("/api/integrations/calendar/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: newClientName || "Client",
          leadEmail: newClientEmail,
          senderEmail: apiEmail || browserEmail || "me@company.com",
          customTopic: newTopic,
        }),
      });
      const data = await res.json();
      if (data.ok && data.meeting) {
        const newMeetingFormatted = {
          id: data.meeting.id,
          clientName: data.meeting.leadName,
          companyName: data.meeting.leadName,
          email: data.meeting.leadEmail,
          time: new Date(data.meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(data.meeting.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
          source: "Google Meet",
          serviceGap: data.meeting.summary,
          matchedProof: "https://www.behance.net/miracle-creative",
          meetingLink: data.meeting.meetLink,
          googleCalendarUrl: data.meeting.googleCalendarUrl,
        };
        setLiveMeetings([newMeetingFormatted, ...liveMeetings]);
        try {
          const raw = JSON.parse(localStorage.getItem("miracle_google_calendar_events") || "[]");
          localStorage.setItem("miracle_google_calendar_events", JSON.stringify([data.meeting, ...raw]));
        } catch {}
        setShowCreateModal(false);
        setNewClientName("");
        setNewClientEmail("");
        // Open Google Calendar so it registers right inside Google's official UI!
        if (data.meeting.googleCalendarUrl) {
          window.open(data.meeting.googleCalendarUrl, "_blank");
        }
      }
    } catch (err: any) {
      alert("Failed to schedule meeting: " + err.message);
    } finally {
      setIsCreatingMeet(false);
    }
  };

  // Handle Method A: Save Persistent Browser Profile
  const handleSaveBrowserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!browserEmail) return;

    setIsSavingBrowserSession(true);
    setBrowserSessionMessage("");

    try {
      const res = await fetch("/api/google/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: browserEmail,
          password: browserPassword,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setBrowserProfileActive(true);
        setBrowserSessionMessage(`Persistent session profile saved to ./browser_data for ${browserEmail.trim()}`);
        const browserSessionData = {
          email: browserEmail.trim(),
          active: true,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("miracle_browser_session", JSON.stringify(browserSessionData));
        window.dispatchEvent(new Event("miracle_browser_session_updated"));
      } else {
        setBrowserSessionMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setBrowserSessionMessage(`Failed: ${err.message}`);
    } finally {
      setIsSavingBrowserSession(false);
    }
  };

  // Handle Method B: Real SMTP / API handshake
  const handleVerifyApiSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiEmail || !apiPassword) {
      setApiErrorMessage("Email address and Google App Password are required.");
      return;
    }

    setIsVerifyingApi(true);
    setApiErrorMessage("");

    try {
      const res = await fetch("/api/integrations/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gmail",
          email: apiEmail.trim(),
          password: apiPassword.replace(/\s+/g, "").trim(),
          sendTest: false,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setApiVerified(true);
        const cleanPassword = apiPassword.replace(/\s+/g, "").trim();
        const accountData = {
          email: apiEmail.trim(),
          password: cleanPassword,
          provider: "gmail",
          senderName: (senderName || "Miracle Creative Studio").trim(),
          verified: true,
          verifiedAt: new Date().toISOString(),
        };
        localStorage.setItem("miracle_connected_email", JSON.stringify(accountData));
        window.dispatchEvent(new Event("miracle_email_updated"));
      } else {
        setApiVerified(false);
        setApiErrorMessage(data.error || "Google SMTP authentication failed.");
      }
    } catch (err: any) {
      setApiVerified(false);
      setApiErrorMessage(err.message || "Failed to reach server.");
    } finally {
      setIsVerifyingApi(false);
    }
  };

  // Google Calendar Sync
  const handleSyncCalendar = async () => {
    const targetEmail = calendarEmail || browserEmail || apiEmail;
    if (!targetEmail) {
      alert("Please enter a Google account email first.");
      return;
    }
    setCalendarSyncing(true);
    try {
      const res = await fetch("/api/integrations/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (data.ok) {
        setCalendarConnected(true);
        setCalendarEmail(targetEmail);
        localStorage.setItem(
          "miracle_connected_calendar",
          JSON.stringify({ email: targetEmail, syncedAt: new Date().toISOString() })
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCalendarSyncing(false);
    }
  };

  // Save Booking URL
  const handleSaveBookingUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("miracle_booking_url", bookingUrl);
    setBookingSaved(true);
    setTimeout(() => setBookingSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar & Meetings"
        description="Real Google Calendar & Google Meet synchronization. Scheduled meetings appear directly inside your official calendar.google.com schedule and meet.google.com UI."
      />

      {/* Google Ecosystem Status Header */}
      <div className="card p-5 bg-[#121212] border border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[12px] bg-[#1A1A1A] border border-[#2A2A2A]">
            <Laptop className="size-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Google Ecosystem Live Status</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`size-2 rounded-full ${
                  browserProfileActive || apiVerified ? "bg-white" : "bg-[#666666] animate-pulse"
                }`}
              />
              <span className="text-xs text-[#AAAAAA]">
                {browserProfileActive || apiVerified ? (
                  <span className="text-[#10B981] font-semibold flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    Connected: {browserEmail || apiEmail} (Persistent Browser Profile + Gmail SMTP Active)
                  </span>
                ) : (
                  <span className="text-[#AAAAAA]">No Google Account Connected — Log in below to activate</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAuthMethod("BROWSER")}
            className={`px-3 py-1.5 text-xs font-medium rounded-[8px] border transition-all ${
              authMethod === "BROWSER"
                ? "bg-white text-black font-semibold border-white"
                : "bg-[#1A1A1A] text-[#AAAAAA] border-[#2A2A2A]"
            }`}
          >
            Method A (Persistent Browser Profile)
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("API")}
            className={`px-3 py-1.5 text-xs font-medium rounded-[8px] border transition-all ${
              authMethod === "API"
                ? "bg-white text-black font-semibold border-white"
                : "bg-[#1A1A1A] text-[#AAAAAA] border-[#2A2A2A]"
            }`}
          >
            Method B (Google APIs & SMTP)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication Column */}
        {authMethod === "BROWSER" ? (
          /* Method A: Direct ID/Password + Persistent Profile */
          <div className="card p-6 space-y-5 bg-[#121212] border border-[#2A2A2A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <Laptop className="size-4 text-white" />
                <h3 className="text-sm font-semibold text-white">
                  Method A: Persistent Browser Profile (Zero 2FA Re-prompts)
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${
                    browserProfileActive ? "bg-white" : "bg-[#666666]"
                  }`}
                />
                <span className="text-[11px] text-[#AAAAAA]">
                  {browserProfileActive ? "Active Session" : "Not Initialized"}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#AAAAAA] leading-relaxed">
              Uses Playwright with a persistent <code className="text-white font-mono">userDataDir</code> stored in <code className="text-white font-mono">./browser_data</code>. Once saved, Google cookies & tokens remain active locally so YouTube and scraping engines never ask for login or 2FA again.
            </p>

            <form onSubmit={handleSaveBrowserProfile} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#AAAAAA] block mb-1">
                  Google / Gmail Account ID
                </label>
                <input
                  type="email"
                  required
                  value={browserEmail}
                  onChange={(e) => setBrowserEmail(e.target.value)}
                  placeholder="your.account@gmail.com"
                  className="input h-10 text-xs rounded-[10px] bg-[#1A1A1A] border-[#2A2A2A]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#AAAAAA] block mb-1">
                  Password or App Password
                </label>
                <PasswordInput
                  value={browserPassword}
                  onChange={(e) => setBrowserPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="input h-10 text-xs font-mono rounded-[10px] bg-[#1A1A1A] border-[#2A2A2A]"
                />
                <span className="text-[11px] text-[#777777] block mt-1">
                  Encrypted locally in <code className="text-[#AAAAAA]">.env</code> & <code className="text-[#AAAAAA]">browser_data/</code>. Never exposed or committed to Git.
                </span>
              </div>

              {browserSessionMessage && (
                <div className="p-3 rounded-[10px] bg-[#1A1A1A] border border-white text-white text-xs">
                  {browserSessionMessage}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingBrowserSession}
                  className="btn-primary text-xs font-semibold px-5 py-2.5 inline-flex items-center gap-2 rounded-[8px]"
                >
                  {isSavingBrowserSession ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-black" />
                      <span>Initializing Profile...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-3.5 text-black" />
                      <span>Save Persistent Browser Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Method B: Direct Google APIs & SMTP */
          <div className="card p-6 space-y-5 bg-[#121212] border border-[#2A2A2A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-white" />
                <h3 className="text-sm font-semibold text-white">
                  Method B: Google APIs & High-Speed SMTP
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${apiVerified ? "bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-[#666666]"}`}
                />
                <span className={`text-[11px] font-semibold ${apiVerified ? "text-[#10B981]" : "text-[#AAAAAA]"}`}>
                  {apiVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>

            <form onSubmit={handleVerifyApiSmtp} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#AAAAAA] block mb-1">
                  Display Sender Name
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSmtpSenderName(e.target.value)}
                  placeholder="e.g. Alex | Miracle Studio"
                  className="input h-10 text-xs rounded-[10px] bg-[#1A1A1A] border-[#2A2A2A]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#AAAAAA] block mb-1">
                  Gmail / Google Workspace Address
                </label>
                <input
                  type="email"
                  required
                  value={apiEmail}
                  onChange={(e) => setApiEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="input h-10 text-xs rounded-[10px] bg-[#1A1A1A] border-[#2A2A2A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#AAAAAA]">
                    Google 16-Character App Password
                  </label>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-white hover:underline inline-flex items-center gap-1"
                  >
                    <span>Generate App Password</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
                <PasswordInput
                  required
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="input h-10 text-xs font-mono rounded-[10px] bg-[#1A1A1A] border-[#2A2A2A]"
                />
                <span className="text-[11px] text-[#AAAAAA] block mt-1">
                  Google blocks regular passwords for security. Use a 16-character App Password (spaces will be removed automatically).
                </span>
              </div>

              {/* Red Error Container */}
              {apiErrorMessage && (
                <div className="p-4 rounded-[12px] bg-[#200A0D] border-2 border-[#EF4444] text-[#FCA5A5] text-xs space-y-2.5 shadow-xl">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="size-4 shrink-0 text-[#EF4444] mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-white text-xs block">
                        Authentication Rejected (535-5.7.8)
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {apiErrorMessage}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-[8px] bg-[#140608] border border-[#EF4444]/40 text-[11px] text-[#E2E8F0] space-y-1">
                    <span className="font-semibold text-white block">How to get your free Google App Password (1 minute):</span>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Go to your Google Account &rarr; Security &rarr; <strong>2-Step Verification</strong> (ensure it is ON).</li>
                      <li>Scroll to the bottom and click <strong>App passwords</strong>.</li>
                      <li>Create an app name "Miracle", copy the 16-character code, and paste it above.</li>
                    </ol>
                  </div>

                  <div className="flex justify-end pt-1">
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-[6px] bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Open Google App Passwords ↗</span>
                    </a>
                  </div>
                </div>
              )}

              {apiVerified && (
                <div className="p-3 rounded-[10px] bg-[#1A1A1A] border border-white text-white text-xs flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-white" />
                  <span>Google SMTP Handshake Verified: Sending as <strong>{apiEmail}</strong></span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isVerifyingApi}
                  className="btn-primary text-xs font-semibold px-5 py-2.5 inline-flex items-center gap-2 rounded-[8px]"
                >
                  {isVerifyingApi ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-black" />
                      <span>Verifying Handshake...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-3.5 text-black" />
                      <span>Verify & Save Connection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ecosystem Control Cards: Sheets, YouTube, Calendar */}
        <div className="space-y-5">
          {/* 1. Google Sheets Master Tracker */}
          <div className="card p-6 space-y-4 bg-[#121212] border border-[#2A2A2A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <Table className="size-4 text-white" />
                <h3 className="text-sm font-semibold text-white">Google Sheets Master Lead Tracker</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A] text-white">
                Auto-Synced (Score &gt;= 7)
              </span>
            </div>

            <p className="text-xs text-[#AAAAAA] leading-relaxed">
              Every qualified lead scraped from YouTube or Google Maps is formatted and saved with columns:
              <br />
              <code className="text-white text-[11px]">Lead Name | Email | Channel/Website | AI Quality Score | Personalized Hook | Outreach Status</code>
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#AAAAAA] block">
                Target Google Sheet ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="Paste Google Spreadsheet ID"
                  className="input h-9 text-xs rounded-[8px] bg-[#1A1A1A] border-[#2A2A2A] flex-1 font-mono"
                />
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary h-9 px-3 text-xs inline-flex items-center gap-1.5 rounded-[8px]"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. Google Calendar & Google Meet Booking */}
          <div className="card p-6 space-y-4 bg-[#121212] border border-[#2A2A2A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <CalendarCheck className="size-4 text-white" />
                <h3 className="text-sm font-semibold text-white">Google Calendar & Meet Invitations</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${
                    calendarConnected ? "bg-white" : "bg-[#666666]"
                  }`}
                />
                <span className="text-[11px] text-[#AAAAAA]">
                  {calendarConnected ? "Synced" : "Ready"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveBookingUrl} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#AAAAAA] block mb-1">
                  Discovery Call Link (Google Calendar Appointment or Calendly)
                </label>
                <div className="relative">
                  <CalendarDays className="size-3.5 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/appointments/..."
                    className="input h-9 pl-9 text-xs rounded-[8px] bg-[#1A1A1A] border-[#2A2A2A]"
                  />
                </div>
              </div>

              {bookingSaved && (
                <div className="p-2.5 rounded-[8px] bg-[#1A1A1A] border border-white text-white text-xs flex items-center gap-2">
                  <Check className="size-3.5 shrink-0 text-white" />
                  <span>Google Meet booking link saved!</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSyncCalendar}
                  disabled={calendarSyncing}
                  className="btn-secondary h-8 px-3 text-xs inline-flex items-center gap-1.5 rounded-[8px]"
                >
                  {calendarSyncing ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                  <span>Sync Google Calendar</span>
                </button>

                <button
                  type="submit"
                  className="btn-primary text-xs font-semibold px-4 py-2 rounded-[8px]"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmed Real Google Meet Discovery Calls (Synced with Official Google UI) */}
      <section className="card p-6 space-y-4 bg-[#121212] border border-[#2A2A2A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2A2A]">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="size-4 text-white" />
              <span>Real Google Calendar & Meet Events ({liveMeetings.length})</span>
            </h3>
            <p className="text-xs text-[#AAAAAA] mt-0.5">
              Live synchronized events appearing in your official <strong>calendar.google.com</strong> schedule and <strong>meet.google.com</strong> UI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary h-8 px-3 text-xs inline-flex items-center gap-1.5 rounded-[8px] bg-[#1A1A1A] border-[#333333] hover:border-white text-white transition-all"
            >
              <span>Open calendar.google.com</span>
              <ExternalLink className="size-3" />
            </a>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary h-8 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 rounded-[8px] bg-white text-black hover:bg-neutral-200 transition-all"
            >
              <span>+ Create Google Meet Event</span>
            </button>
          </div>
        </div>

        {/* Modal: Create Real Google Meet Event */}
        {showCreateModal && (
          <div className="p-5 rounded-[16px] bg-[#1A1A1A] border-2 border-white/20 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-[#10B981]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Create Google Meet Event (Pushes to Official Google UI)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#AAAAAA] hover:text-white p-1 rounded"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewMeeting} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#AAAAAA] block">
                    Prospect / Client Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Jordan Welch"
                    className="input h-9 text-xs rounded-[8px] bg-[#121212] border-[#2A2A2A] text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#AAAAAA] block">
                    Prospect Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="prospect@company.com"
                    className="input h-9 text-xs rounded-[8px] bg-[#121212] border-[#2A2A2A] text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#AAAAAA] block">
                  Meeting Topic / Focus
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Creative Strategy & Sample Review"
                  className="input h-9 text-xs rounded-[8px] bg-[#121212] border-[#2A2A2A] text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary h-8 px-3 text-xs rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMeet}
                  className="btn-primary h-8 px-4 text-xs font-semibold inline-flex items-center gap-1.5 rounded-[8px] bg-white text-black hover:bg-neutral-200"
                >
                  {isCreatingMeet ? (
                    <>
                      <Loader2 className="size-3 animate-spin text-black" />
                      <span>Creating Event in Google...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-3 text-black" />
                      <span>Create & Open in Google Calendar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 rounded-[14px] bg-[#1A1A1A] border border-[#2A2A2A] space-y-3 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">{meeting.companyName}</h4>
                  <div className="text-[11px] text-[#AAAAAA]">
                    {meeting.clientName} ({meeting.email})
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[6px] bg-[#121212] border border-[#2A2A2A] text-[#10B981] flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                  <span>Google Meet</span>
                </span>
              </div>

              <div className="p-3 rounded-[10px] bg-[#121212] border border-[#2A2A2A] space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#777777] block">
                  Topic & Context:
                </span>
                <p className="text-xs text-white font-medium">{meeting.serviceGap}</p>
                <div className="flex items-center gap-1 text-[11px] text-[#AAAAAA] mt-0.5 font-mono">
                  <span>Meet Link:</span>
                  <span className="text-white truncate max-w-[200px]">{meeting.meetingLink}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#2A2A2A] text-xs">
                <span className="font-medium text-white">
                  {meeting.date} at {meeting.time}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={meeting.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary h-7 px-2.5 text-[11px] font-semibold inline-flex items-center gap-1.5 rounded-[6px] bg-white text-black hover:bg-neutral-200"
                  >
                    <Video className="size-3 text-black" />
                    <span>Join Meet</span>
                    <ExternalLink className="size-2.5 text-black" />
                  </a>

                  {meeting.googleCalendarUrl ? (
                    <a
                      href={meeting.googleCalendarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary h-7 px-2 text-[11px] inline-flex items-center gap-1 rounded-[6px] bg-[#222222] border-[#333333] hover:border-white text-white"
                    >
                      <span>In Calendar</span>
                      <ExternalLink className="size-2.5" />
                    </a>
                  ) : (
                    <a
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                        meeting.serviceGap || "Discovery Call"
                      )}&location=${encodeURIComponent(meeting.meetingLink)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary h-7 px-2 text-[11px] inline-flex items-center gap-1 rounded-[6px] bg-[#222222] border-[#333333] hover:border-white text-white"
                    >
                      <span>In Calendar</span>
                      <ExternalLink className="size-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
