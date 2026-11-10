"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Video,
  X,
  AlertCircle,
  Calendar,
} from "lucide-react";
import type { StoredMeeting } from "@/app/api/calendar/route";

export function MeetingsView() {
  const [meetings, setMeetings] = useState<StoredMeeting[]>([]);
  const [filterTab, setFilterTab] = useState<"UPCOMING" | "TODAY" | "THIS_WEEK" | "PAST" | "ALL">("UPCOMING");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Calendar connection state
  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean;
    status: string;
    accountEmail: string;
    selectedCalendarName: string;
    lastSyncedAt: string | null;
  }>({
    connected: false,
    status: "CONFIGURATION_REQUIRED",
    accountEmail: "",
    selectedCalendarName: "Primary Google Calendar",
    lastSyncedAt: null,
  });

  // Schedule modal state
  const [showModal, setShowModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("14:00");
  const [newDuration, setNewDuration] = useState("30");
  const [newNotes, setNewNotes] = useState("");
  const [attachMeet, setAttachMeet] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch status and meetings on mount
  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (data.ok) {
        setCalendarStatus({
          connected: data.connected,
          status: data.status,
          accountEmail: data.accountEmail || "",
          selectedCalendarName: data.selectedCalendarName || "Primary Google Calendar",
          lastSyncedAt: data.lastSyncedAt,
        });
        if (Array.isArray(data.meetings)) {
          setMeetings(data.meetings);
        }
      }
    } catch (e) {
      console.error("Error loading calendar data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatusMessage(data.message || "✓ Google Calendar events synchronized!");
        if (Array.isArray(data.meetings)) setMeetings(data.meetings);
      } else {
        setStatusMessage(`Sync info: ${data.error || "Google Calendar not connected"}`);
      }
    } catch (err: any) {
      setStatusMessage(`Error syncing: ${err.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      setStatusMessage(data.diagnostic || (data.ok ? "✓ Google Calendar verified!" : "Connection check failed"));
    } catch (err: any) {
      setStatusMessage(`Test error: ${err.message}`);
    } finally {
      setTesting(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_event",
          clientName: newClientName,
          clientEmail: newClientEmail,
          businessName: newBusinessName || "Client Project",
          dateStr: newDate,
          timeStr: newTime,
          durationMinutes: Number(newDuration),
          notes: newNotes,
          attachMeet,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setNewClientName("");
        setNewClientEmail("");
        setNewBusinessName("");
        setNewNotes("");
        setStatusMessage(data.message || "✓ Meeting scheduled inside Miracle! Google Meet link generated.");
        loadCalendarData();
      } else {
        setStatusMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", meetingId }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.meetings)) {
        setMeetings(data.meetings);
        setStatusMessage("Meeting deleted.");
        setTimeout(() => setStatusMessage(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter logic
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 3600 * 1000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 3600 * 1000);

  const filteredMeetings = meetings.filter((m) => {
    const meetDate = new Date(m.startTime);

    if (filterTab === "TODAY") {
      if (meetDate < todayStart || meetDate >= todayEnd) return false;
    } else if (filterTab === "THIS_WEEK") {
      if (meetDate < todayStart || meetDate >= weekEnd) return false;
    } else if (filterTab === "UPCOMING") {
      if (meetDate < now) return false;
    } else if (filterTab === "PAST") {
      if (meetDate >= now) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchClient = m.clientName.toLowerCase().includes(q);
      const matchBusiness = m.businessName.toLowerCase().includes(q);
      const matchNotes = (m.topic || "").toLowerCase().includes(q);
      return matchClient || matchBusiness || matchNotes;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & GOOGLE CALENDAR CONNECTION BAR          */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarCheck className="size-5 text-[#10B981]" />
            Meetings & Google Calendar
          </h1>
          <p className="text-xs text-[#888888] mt-1">
            Real appointments, Google Meet video conferences, and bidirectional calendar synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            className="rounded-[6px] border border-[#2A2A2A] bg-[#161616] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#202020] inline-flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${syncing ? "animate-spin text-[#10B981]" : "text-[#888888]"}`} />
            <span>{syncing ? "Syncing..." : "Sync Now"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const testStartTime = new Date(Date.now() + 24 * 3600 * 1000);
              const testEndTime = new Date(testStartTime.getTime() + 30 * 60 * 1000);
              const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
              const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                "Miracle Client Strategy Session"
              )}&dates=${encodeURIComponent(formatGCalDate(testStartTime))}/${encodeURIComponent(
                formatGCalDate(testEndTime)
              )}&details=${encodeURIComponent(
                "Google Meet Video Call: https://meet.google.com/new\n\nClient Creative Strategy & Scope Discussion.\nScheduled via Miracle."
              )}&location=${encodeURIComponent("Google Meet: https://meet.google.com/new")}`;
              window.open(url, "_blank");
            }}
            className="rounded-[6px] border border-[#10B981]/40 bg-[#10B981]/10 px-3 py-1.5 text-xs font-semibold text-[#10B981] hover:bg-[#10B981]/20 inline-flex items-center gap-1.5 transition"
          >
            <Calendar className="size-3.5 text-[#10B981]" />
            <span>Instant Add in Google Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-[6px] bg-[#10B981] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#059669] inline-flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Verified Google Calendar Connection Card */}
      <div className="rounded-[10px] border border-[#222222] bg-[#121212] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#262626] bg-[#181818]">
            <Calendar className="size-4 text-[#10B981]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Google Calendar</span>
              {calendarStatus.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-semibold text-[#10B981] border border-[#10B981]/30">
                  <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Connected & Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-semibold text-[#F59E0B] border border-[#F59E0B]/30">
                  <AlertCircle className="size-3" />
                  Authorization Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#888888] mt-0.5">
              Target Calendar: <strong className="text-white">{calendarStatus.selectedCalendarName}</strong>
              {calendarStatus.accountEmail && (
                <span> ({calendarStatus.accountEmail})</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="rounded-[6px] border border-[#262626] bg-[#181818] px-3 py-1.5 text-xs text-[#CCCCCC] hover:text-white hover:bg-[#222222] transition disabled:opacity-50"
          >
            {testing ? "Testing API..." : "Test Connection"}
          </button>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[6px] border border-[#262626] bg-[#181818] px-3 py-1.5 text-xs text-[#CCCCCC] hover:text-white hover:bg-[#222222] inline-flex items-center gap-1 transition"
          >
            <span>Open Google Calendar</span>
            <ExternalLink className="size-3 text-[#777777]" />
          </a>

          <Link
            href="/settings"
            className="rounded-[6px] border border-[#262626] bg-[#181818] px-3 py-1.5 text-xs text-[#10B981] hover:bg-[#222222] transition"
          >
            Configure in Settings
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-[8px] bg-[#1A1A1A] border border-[#2E2E2E] p-3 text-xs text-[#E5E5E5] flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[#888888] hover:text-white">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FILTER TABS & SEARCH ROW                             */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-lg border border-[#222222] text-xs">
          {(["UPCOMING", "TODAY", "THIS_WEEK", "PAST", "ALL"] as const).map((tab) => {
            const labels = {
              UPCOMING: "Upcoming",
              TODAY: "Today",
              THIS_WEEK: "This Week",
              PAST: "Past",
              ALL: "All",
            };
            const isActive = filterTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1 rounded-[6px] font-medium transition ${
                  isActive
                    ? "bg-[#222222] text-white shadow-sm font-semibold"
                    : "text-[#888888] hover:text-[#CCCCCC]"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 absolute left-3 top-2.5 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings by client or company..."
            className="input bg-[#141414] border-[#222222] pl-8 text-xs text-white h-8 w-full rounded-md"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MEETINGS LIST OR GENUINE EMPTY STATE                  */}
      {/* ======================================================== */}
      {loading ? (
        <div className="rounded-[10px] border border-[#222222] bg-[#121212] p-12 text-center text-xs text-[#777777]">
          Loading scheduled meetings from database and Google Calendar...
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="rounded-[10px] border border-[#222222] bg-[#121212] p-12 text-center space-y-3">
          <div className="grid size-12 place-items-center rounded-full bg-[#181818] border border-[#262626] mx-auto text-[#666666]">
            <CalendarCheck className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No upcoming meetings</h3>
          <p className="text-xs text-[#888888] max-w-sm mx-auto">
            No meetings found for this filter. When a lead replies and books a call, or when you schedule a strategy session, confirmed events will appear here with live Google Meet links.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-[6px] bg-[#1E1E1E] border border-[#2A2A2A] px-3.5 py-1.5 text-xs text-white hover:bg-[#252525] inline-flex items-center gap-1.5 transition"
            >
              <Plus className="size-3.5 text-[#10B981]" />
              <span>Schedule Strategy Call</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredMeetings.map((m) => {
            const startDate = new Date(m.startTime);
            const dateDisplay = startDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const timeDisplay = startDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });

            const isGoogleSynced = m.status === "CONFIRMED_GOOGLE_CALENDAR";

            return (
              <div
                key={m.id}
                className="rounded-[10px] border border-[#202020] bg-[#121212] hover:border-[#2A2A2A] p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-white">{m.clientName}</span>
                    <span className="text-xs text-[#888888]">({m.businessName})</span>
                    {isGoogleSynced ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-semibold text-[#10B981] border border-[#10B981]/30">
                        <CheckCircle2 className="size-3" />
                        Google Calendar Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-semibold text-[#F59E0B] border border-[#F59E0B]/30">
                        Local Record (Unsynced)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#AAAAAA]">
                    <span className="flex items-center gap-1 text-[#E5E5E5] font-medium">
                      <Clock className="size-3 text-[#10B981]" />
                      {dateDisplay} at {timeDisplay} ({m.durationMinutes} mins)
                    </span>
                    {m.clientEmail && (
                      <span className="text-[#777777]">&bull; {m.clientEmail}</span>
                    )}
                  </div>

                  {m.topic && (
                    <p className="text-xs text-[#777777] line-clamp-1 max-w-xl">
                      {m.topic}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {m.googleEventUrl && (
                    <a
                      href={m.googleEventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[6px] bg-[#10B981] hover:bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition shadow-sm"
                      title="Add or View in Google Calendar"
                    >
                      <Calendar className="size-3.5" />
                      <span>Add to Google Calendar</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}

                  {m.googleMeetUrl && (
                    <a
                      href={m.googleMeetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[6px] border border-[#2A2A2A] bg-[#1A1A1A] hover:bg-[#252525] px-3 py-1.5 text-xs font-medium text-white inline-flex items-center gap-1.5 transition"
                    >
                      <Video className="size-3.5 text-[#10B981]" />
                      <span>Join Meet</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteMeeting(m.id)}
                    className="rounded-[6px] border border-transparent p-1.5 text-[#666666] hover:text-[#EF4444] hover:bg-[#202020] transition"
                    title="Remove Meeting"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SCHEDULE MEETING MODAL                                */}
      {/* ======================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#2A2A2A] bg-[#141414] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <CalendarCheck className="size-4 text-[#10B981]" />
                Schedule Strategy Session
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#888888] hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="input bg-[#1A1A1A] border-[#2A2A2A] text-xs text-white h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="marcus@company.com"
                    className="input bg-[#1A1A1A] border-[#2A2A2A] text-xs text-white h-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                  Business / Company Name
                </label>
                <input
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="e.g. Apex Luxury Properties"
                  className="input bg-[#1A1A1A] border-[#2A2A2A] text-xs text-white h-9"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="input bg-[#1A1A1A] border-[#2A2A2A] text-xs text-white h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="input bg-[#1A1A1A] border-[#2A2A2A] text-xs text-white h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                    Duration
                  </label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="input bg-[#1A1A1A] border-[#2A2A2A] text-xs text-white h-9"
                  >
                    <option value="15">15 mins</option>
                    <option value="30">30 mins</option>
                    <option value="45">45 mins</option>
                    <option value="60">60 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#888888] block mb-1">
                  Meeting Notes / Agenda
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Scope review, design retainer discussion, and creative showreel walkthrough."
                  className="input bg-[#1A1A1A] border-[#2A2A2A] text-xs text-white py-2"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={attachMeet}
                  onChange={(e) => setAttachMeet(e.target.checked)}
                  className="size-3.5 accent-[#10B981] rounded"
                />
                <span className="text-xs text-[#CCCCCC]">
                  Attach Google Meet video conference link automatically
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-[6px] border border-[#2A2A2A] bg-transparent px-3 py-1.5 text-xs text-[#888888] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[6px] bg-[#10B981] hover:bg-[#059669] px-4 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {submitting ? "Booking..." : "Confirm & Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
