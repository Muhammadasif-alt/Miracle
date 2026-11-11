"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  Inbox,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sparkles,
  Trash2,
  Undo2,
  User,
  X,
  Bot,
  Briefcase,
  FileText,
  DollarSign,
} from "lucide-react";
import { PitchModal, type PitchLead } from "@/components/leads/PitchModal";
import { realEmail } from "@/lib/lead-email";

export type LeadTab =
  | "ALL"
  | "ACTIVE"
  | "NEW"
  | "RESEARCHED"
  | "CONTACTED"
  | "FOLLOW_UP_DUE"
  | "REPLIED"
  | "MEETINGS"
  | "ARCHIVED"
  | "BIN";

export function AllLeadsView() {
  const [leads, setLeads] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<LeadTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [pitchingLead, setPitchingLead] = useState<PitchLead | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMenuLeadId, setActionMenuLeadId] = useState<string | null>(null);

  // AI Client Agent & Proposal State
  const [generatingAiReply, setGeneratingAiReply] = useState(false);
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [activeProposal, setActiveProposal] = useState<any | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [meetingSlotNotice, setMeetingSlotNotice] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);

  // When selected lead changes, fetch proposals
  useEffect(() => {
    if (selectedLead?.id) {
      fetch(`/api/proposals?leadId=${selectedLead.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && Array.isArray(d.proposals)) {
            setProposals(d.proposals);
          }
        })
        .catch(() => undefined);
    } else {
      setProposals([]);
    }
  }, [selectedLead?.id]);

  const fetchLeads = (tab: LeadTab = activeTab, query: string = searchQuery) => {
    setLoading(true);
    const params = new URLSearchParams({ tab, q: query });
    fetch(`/api/leads?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.leads)) {
          setLeads(d.leads);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads(activeTab, searchQuery);
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(activeTab, searchQuery);
  };

  const executeLeadAction = async (action: string, leadId: string, confirmMessage?: string) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }
    setActionMenuLeadId(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, leadId }),
      });
      const d = await res.json();
      if (d.ok) {
        if (selectedLead && selectedLead.id === leadId) {
          if (action === "permanent_delete" || action === "bin") {
            setSelectedLead(null);
          }
        }
        fetchLeads(activeTab, searchQuery);
      } else {
        alert(d.error || "Action failed");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    }
  };

  const handleUpdateStage = async (leadId: string, stage: string) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_stage", leadId, stage }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchLeads(activeTab, searchQuery);
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, status: stage, stage });
        }
      }
    } catch {}
  };

  const handleSendReply = async () => {
    if (!selectedLead || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_reply",
          leadId: selectedLead.id,
          messageText: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchLeads(activeTab, searchQuery);
        const msgs = selectedLead.messages || [];
        msgs.push({
          id: "m-" + Date.now(),
          sender: "you",
          text: replyText.trim(),
          timestamp: "Just now",
        });
        setSelectedLead({ ...selectedLead, messages: msgs, status: "REPLIED" });
        setReplyText("");
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  const handleGenerateAiReply = async (leadId: string) => {
    setGeneratingAiReply(true);
    setAiNotice(null);
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest_reply", leadId }),
      });
      const d = await res.json();
      if (d.ok && d.suggestedReply) {
        setSelectedLead((prev: any) => ({
          ...prev,
          suggestedReply: d.suggestedReply,
          intent: d.intent,
          detectedService: d.detectedService,
        }));
        setAiNotice(`✓ AI reply drafted (${d.intent || "Client inquiry"})`);
      } else {
        setAiNotice(`Failed: ${d.error || "No reply generated"}`);
      }
    } catch (e: any) {
      setAiNotice(`Error: ${e.message}`);
    } finally {
      setGeneratingAiReply(false);
      setTimeout(() => setAiNotice(null), 4000);
    }
  };

  const handleApproveReply = async (leadId: string, replyContent: string) => {
    setSendingReply(true);
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_reply", leadId, replyContent }),
      });
      const d = await res.json();
      if (d.ok) {
        setSelectedLead((prev: any) => ({
          ...prev,
          suggestedReply: null,
          messages: [
            ...(prev?.messages || []),
            {
              id: "m-" + Date.now(),
              sender: "you",
              text: replyContent,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ],
        }));
        fetchLeads(activeTab, searchQuery);
      }
    } catch (e: any) {
      alert(`Send failed: ${e.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateProposal = async (leadId: string, serviceKey: string = "logo_design") => {
    setCreatingProposal(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", leadId, serviceKey }),
      });
      const d = await res.json();
      if (d.ok && d.proposal) {
        setActiveProposal(d.proposal);
        setShowProposalModal(true);
        // Refresh proposals list
        setProposals((prev) => [d.proposal, ...prev.filter((p) => p.id !== d.proposal.id)]);
      } else {
        alert(d.error || "Failed to create proposal");
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setCreatingProposal(false);
    }
  };

  const handleUpdateProposalStatus = async (proposalId: string, status: "APPROVED" | "SENT" | "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: status.toLowerCase(), proposalId }),
      });
      const d = await res.json();
      if (d.ok && d.proposal) {
        setActiveProposal(d.proposal);
        setProposals((prev) => prev.map((p) => (p.id === proposalId ? d.proposal : p)));
        fetchLeads(activeTab, searchQuery);
      }
    } catch (e: any) {
      alert(`Action error: ${e.message}`);
    }
  };

  const handleQuickBookMeeting = async (lead: any) => {
    setSchedulingMeeting(true);
    setMeetingSlotNotice(null);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          leadId: lead.id,
          clientName: lead.contactName || lead.companyName,
          clientEmail: realEmail(lead.contactEmail, lead.email) ?? "",
          businessName: lead.companyName || lead.businessName,
          topic: `Strategy & Creative Review — ${lead.companyName}`,
          startTime: tomorrow.toISOString(),
          durationMinutes: 30,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setMeetingSlotNotice(`✓ Meeting confirmed with Google Meet! Link: ${d.meeting?.googleMeetUrl || "Generated"}`);
        setSelectedLead((prev: any) => ({ ...prev, status: "MEETING_BOOKED" }));
        fetchLeads(activeTab, searchQuery);
      } else {
        setMeetingSlotNotice(`Booking error: ${d.error}`);
      }
    } catch (e: any) {
      setMeetingSlotNotice(`Error: ${e.message}`);
    } finally {
      setSchedulingMeeting(false);
      setTimeout(() => setMeetingSlotNotice(null), 6000);
    }
  };

  const tabs: { key: LeadTab; label: string }[] = [
    { key: "ALL", label: "All Leads" },
    { key: "ACTIVE", label: "Active" },
    { key: "NEW", label: "New" },
    { key: "RESEARCHED", label: "Researched" },
    { key: "CONTACTED", label: "Contacted" },
    { key: "FOLLOW_UP_DUE", label: "Follow-up Due" },
    { key: "REPLIED", label: "Replied" },
    { key: "MEETINGS", label: "Meetings" },
    { key: "ARCHIVED", label: "Archived" },
    { key: "BIN", label: "Lead Bin" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Page Title & Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--n-1e1e2d) pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">All Leads CRM</h1>
            <span className="text-[10px] font-mono uppercase bg-(--n-191926) text-(--accent) px-2 py-0.5 rounded border border-(--n-29293d)">
              7-Day Lifecycle Protected
            </span>
          </div>
          <p className="text-xs text-(--n-888888) mt-0.5">
            Deduplicated contact memory, 3-day follow-up triggers, automatic 7-day archival, and Lead Bin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-(--n-71717a)" />
            <input
              type="text"
              placeholder="Search companies or emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 bg-(--n-13131d) border-(--n-212132) text-xs text-white h-8 w-full"
            />
          </form>

          <button
            type="button"
            onClick={() => fetchLeads(activeTab, searchQuery)}
            className="p-2 rounded-[6px] bg-(--n-13131d) border border-(--n-212132) text-(--n-888888) hover:text-white"
            title="Refresh leads"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-(--accent)" : ""}`} />
          </button>

          <Link
            href="/pitch-studio"
            className="rounded-[6px] bg-(--accent) px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-[#0EA5E9] transition-all shrink-0 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>New Pitch</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-(--n-1e1e2d) overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          const isBin = tab.key === "BIN";
          const isArchived = tab.key === "ARCHIVED";
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
                active
                  ? isBin
                    ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-semibold"
                    : isArchived
                    ? "bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/40 font-semibold"
                    : "bg-(--n-1e1e2d) text-white border border-(--n-313147) font-semibold"
                  : "text-(--n-888888) hover:text-white hover:bg-(--n-13131d) border border-transparent"
              }`}
            >
              {isBin && <Trash2 className="size-3" />}
              {isArchived && <Archive className="size-3" />}
              <span>{tab.label}</span>
              {active && <span className="text-[10px] opacity-75 font-mono">({leads.length})</span>}
            </button>
          );
        })}
      </div>

      {/* Main Leads Table */}
      <div className="rounded-[10px] border border-(--n-1e1e2d) bg-(--n-101018) overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-(--n-a1a1aa)">
            <thead className="bg-(--n-13131d) text-(--n-71717a) text-[10px] font-semibold uppercase tracking-wider border-b border-(--n-1e1e2d)">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Fit Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Lifecycle / Action</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--n-1e1e2d)">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-(--n-71717a)">
                    {activeTab === "BIN"
                      ? "Lead Bin is empty. Deleted leads are retained here with suppression protection."
                      : activeTab === "ARCHIVED"
                      ? "No archived leads. Unresponsive prospects are safely archived after 7 days."
                      : "No leads found for this view."}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const company = lead.companyName || lead.businessName || "Unnamed Business";
                  const contact = lead.contactName || "Owner not verified";
                  const email = realEmail(lead.contactEmail, lead.email);
                  const industry = lead.industry || lead.niche || "Creative";
                  const loc = [lead.city, lead.country].filter(Boolean).join(", ") || "Global";
                  const score = lead.fitScore || lead.leadScore || null;

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-(--n-15151f) transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        <div>
                          <p className="font-semibold text-white">{company}</p>
                          {lead.website && (
                            <a
                              href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
                            >
                              <span>{lead.website.replace(/^https?:\/\//, "")}</span>
                              <ExternalLink className="size-2.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-white">{contact}</p>
                        <span className="text-[11px] text-(--n-71717a) font-mono">{email || "No email"}</span>
                      </td>

                      <td className="px-4 py-3 text-(--n-d4d4d8)">{industry}</td>

                      <td className="px-4 py-3 text-(--n-71717a)">{loc}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{score ?? "—"}</span>
                          <div className="w-12 h-1.5 rounded-full bg-(--n-1e1e2d) overflow-hidden">
                            <div
                              className="h-full rounded-full bg-(--accent)"
                              style={{ width: `${Math.min(100, score ?? 0)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                            lead.isInBin
                              ? "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30"
                              : lead.isArchived
                              ? "bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/30"
                              : lead.status === "MEETING_BOOKED" || lead.stage === "MEETING_BOOKED"
                              ? "bg-(--accent)/10 text-(--accent) border border-(--accent)/20"
                              : lead.status === "REPLIED" || lead.stage === "REPLIED"
                              ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                              : lead.status === "INITIAL_SENT" || lead.stage === "CONTACTED"
                              ? "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20"
                              : "bg-(--n-1e1e2d) text-(--n-888888)"
                          }`}
                        >
                          {lead.isInBin
                            ? "In Bin"
                            : lead.isArchived
                            ? "Archived"
                            : lead.status || lead.stage || "New"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[11px] text-(--n-71717a)">
                        {lead.isInBin ? (
                          <span className="text-[#EF4444]">Moved to Bin</span>
                        ) : lead.isArchived ? (
                          <span className="text-[#818CF8]">{lead.archiveReason || "7-Day Auto Archive"}</span>
                        ) : lead.status === "FOLLOW_UP_DUE" ? (
                          <span className="text-[#F59E0B] font-semibold">Follow-Up Due (3d)</span>
                        ) : (
                          lead.lastSimulatedAction || lead.lastActivityAt || "Recently Added"
                        )}
                      </td>

                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex items-center gap-1.5">
                          {lead.isInBin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => executeLeadAction("restore", lead.id)}
                                className="rounded-[4px] bg-(--n-191926) border border-(--n-2c2c42) text-(--accent) hover:bg-(--accent)/10 text-[11px] px-2 py-1 flex items-center gap-1"
                                title="Restore to CRM"
                              >
                                <Undo2 className="size-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  executeLeadAction(
                                    "permanent_delete",
                                    lead.id,
                                    `Permanently delete ${company}? Its suppression fingerprint will be preserved in the registry to prevent accidental outreach.`
                                  )
                                }
                                className="rounded-[4px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 text-[11px] px-2 py-1 flex items-center gap-1"
                                title="Permanently delete"
                              >
                                <Trash2 className="size-3" />
                                <span>Delete</span>
                              </button>
                            </>
                          ) : lead.isArchived ? (
                            <>
                              <button
                                type="button"
                                onClick={() => executeLeadAction("unarchive", lead.id)}
                                className="rounded-[4px] bg-(--n-191926) border border-(--n-2c2c42) text-white hover:text-(--accent) text-[11px] px-2 py-1 flex items-center gap-1"
                                title="Unarchive lead"
                              >
                                <ArchiveRestore className="size-3" />
                                <span>Unarchive</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => executeLeadAction("bin", lead.id)}
                                className="rounded-[4px] bg-(--n-191926) border border-(--n-2c2c42) text-(--n-71717a) hover:text-[#EF4444] text-[11px] p-1"
                                title="Move to Bin"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setPitchingLead({
                                    id: lead.id,
                                    businessName: company,
                                    email: email,
                                    website: lead.website,
                                    niche: industry,
                                    city: lead.city,
                                    country: lead.country,
                                    leadScore: score ?? undefined,
                                    auditFinding: lead.auditFindings,
                                    recommendedService: lead.recommendedService,
                                  });
                                }}
                                className="rounded-[4px] bg-(--accent) text-black font-semibold text-[11px] px-2.5 py-1 hover:bg-[#0EA5E9] transition-all"
                              >
                                Pitch &rarr;
                              </button>
                              <button
                                type="button"
                                onClick={() => executeLeadAction("archive", lead.id)}
                                className="rounded-[4px] bg-(--n-191926) border border-(--n-2c2c42) text-(--n-71717a) hover:text-white text-[11px] p-1"
                                title="Archive lead"
                              >
                                <Archive className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => executeLeadAction("bin", lead.id)}
                                className="rounded-[4px] bg-(--n-191926) border border-(--n-2c2c42) text-(--n-71717a) hover:text-[#EF4444] text-[11px] p-1"
                                title="Move to Bin"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEAD DETAILS DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-(--n-101018) border-l border-(--n-1e1e2d) h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-(--n-1e1e2d) pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-[8px] bg-(--n-191926) border border-(--n-2c2c42) text-white font-bold text-sm">
                  {(selectedLead.companyName || selectedLead.businessName || "M").charAt(0)}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {selectedLead.companyName || selectedLead.businessName}
                  </h2>
                  <p className="text-xs text-(--n-888888)">
                    {selectedLead.industry || selectedLead.niche} &bull; {selectedLead.city}, {selectedLead.country}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-(--n-71717a) hover:text-white p-1 rounded"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Status & Suppression Bar */}
            <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-(--n-13131d) border border-(--n-212132)">
              <div className="flex items-center gap-2">
                <Shield className="size-3.5 text-(--accent)" />
                <span className="text-[11px] text-(--n-a1a1aa)">Lead State:</span>
                <span className="text-[11px] font-semibold text-white">
                  {selectedLead.isInBin ? "In Bin" : selectedLead.isArchived ? "Archived" : selectedLead.status || "Active"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {!selectedLead.isInBin && !selectedLead.isArchived && (
                  <>
                    <button
                      type="button"
                      onClick={() => executeLeadAction("archive", selectedLead.id)}
                      className="text-[11px] text-(--n-888888) hover:text-white px-2 py-0.5 rounded bg-(--n-1b1b29)"
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => executeLeadAction("bin", selectedLead.id)}
                      className="text-[11px] text-[#EF4444] hover:bg-[#EF4444]/10 px-2 py-0.5 rounded"
                    >
                      Move to Bin
                    </button>
                  </>
                )}
                {selectedLead.isInBin && (
                  <button
                    type="button"
                    onClick={() => executeLeadAction("restore", selectedLead.id)}
                    className="text-[11px] text-(--accent) hover:bg-(--accent)/10 px-2 py-0.5 rounded"
                  >
                    Restore from Bin
                  </button>
                )}
              </div>
            </div>

            {/* Quick Action Controls */}
            {!selectedLead.isInBin && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPitchingLead({
                      id: selectedLead.id,
                      businessName: selectedLead.companyName || selectedLead.businessName,
                      email: realEmail(selectedLead.contactEmail, selectedLead.email),
                      website: selectedLead.website,
                      niche: selectedLead.industry || selectedLead.niche,
                      city: selectedLead.city,
                      country: selectedLead.country,
                      leadScore: selectedLead.fitScore || selectedLead.leadScore,
                      auditFinding: selectedLead.auditFindings,
                      recommendedService: selectedLead.recommendedService,
                    });
                  }}
                  className="rounded-[6px] bg-(--accent) px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#0EA5E9] transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  <span>Generate Pitch</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateProposal(selectedLead.id, "logo_design")}
                  disabled={creatingProposal}
                  className="rounded-[6px] bg-(--n-171723) border border-(--n-27273a) px-3 py-1.5 text-xs font-medium text-white hover:bg-(--n-212132) flex items-center gap-1.5"
                >
                  <FileText className="size-3.5 text-[#38BDF8]" />
                  <span>{creatingProposal ? "Creating..." : "Create Proposal"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickBookMeeting(selectedLead)}
                  disabled={schedulingMeeting}
                  className="rounded-[6px] bg-(--n-171723) border border-(--n-27273a) px-3 py-1.5 text-xs font-medium text-white hover:bg-(--n-212132) flex items-center gap-1.5"
                >
                  <CalendarCheck className="size-3.5 text-(--accent)" />
                  <span>{schedulingMeeting ? "Booking Meet..." : "Book Google Meet"}</span>
                </button>
              </div>
            )}

            {meetingSlotNotice && (
              <div className="p-2.5 rounded-[6px] bg-(--accent)/10 border border-(--accent)/25 text-xs text-(--accent)">
                {meetingSlotNotice}
              </div>
            )}

            {aiNotice && (
              <div className="p-2.5 rounded-[6px] bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-xs text-[#38BDF8]">
                {aiNotice}
              </div>
            )}

            {/* AI SALES CONVERSATION INTELLIGENCE */}
            {!selectedLead.isInBin && (
              <div className="rounded-[8px] bg-(--n-15151f) border border-(--n-212132) p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-(--n-1f1f2e) pb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="size-3.5 text-(--accent)" />
                    <span className="text-xs font-bold text-white">AI Sales Assistant</span>
                    <span className="text-[10px] bg-(--accent)/15 text-(--accent) px-2 py-0.5 rounded font-mono">
                      {selectedLead.intent || "Active Reply Monitor"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateAiReply(selectedLead.id)}
                    disabled={generatingAiReply}
                    className="text-[11px] text-[#38BDF8] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`size-3 ${generatingAiReply ? "animate-spin" : ""}`} />
                    <span>{generatingAiReply ? "Analyzing..." : "Suggest Reply"}</span>
                  </button>
                </div>

                {selectedLead.suggestedReply && (
                  <div className="p-3 rounded-[6px] bg-(--n-191926) border border-(--n-29293d) space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-(--n-888888)">
                      <span>AI Proposed Response</span>
                      <span className="text-(--accent)">Ready for approval</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed font-mono whitespace-pre-wrap">
                      {selectedLead.suggestedReply}
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-(--n-252538)">
                      <button
                        type="button"
                        onClick={() => setReplyText(selectedLead.suggestedReply)}
                        className="text-[11px] text-(--n-a1a1aa) hover:text-white px-2 py-1 rounded"
                      >
                        Copy to Input
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveReply(selectedLead.id, selectedLead.suggestedReply)}
                        disabled={sendingReply}
                        className="rounded-[6px] bg-(--accent) px-3 py-1 text-xs font-semibold text-black hover:bg-[#0EA5E9]"
                      >
                        {sendingReply ? "Sending..." : "Approve & Send"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DYNAMIC PROPOSALS SECTION */}
            {proposals.length > 0 && (
              <div className="rounded-[8px] bg-(--n-15151f) border border-(--n-212132) p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-(--n-1f1f2e) pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="size-3.5 text-(--accent)" />
                    <span>Active Proposals ({proposals.length})</span>
                  </span>
                </div>

                {proposals.map((prop: any) => (
                  <div
                    key={prop.id}
                    className="p-3 rounded-[6px] bg-(--n-171723) border border-(--n-252538) flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{prop.serviceName}</span>
                        <span className="text-[10px] font-mono bg-(--accent)/20 text-(--accent) px-1.5 py-0.5 rounded">
                          ${prop.totalPrice} USD
                        </span>
                        <span className="text-[10px] text-(--n-a1a1aa)">
                          Status: <strong className="text-white">{prop.status}</strong>
                        </span>
                      </div>
                      <div className="text-[11px] text-(--n-71717a) mt-1">
                        Advance: ${prop.advanceAmount} ({prop.advancePercent}%) &bull; {prop.revisionsIncluded} Revisions
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {prop.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateProposalStatus(prop.id, "SENT")}
                          className="rounded-[4px] bg-(--accent) px-2.5 py-1 text-[11px] font-semibold text-black hover:bg-[#0EA5E9]"
                        >
                          Send Proposal
                        </button>
                      )}
                      {prop.status === "SENT" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateProposalStatus(prop.id, "ACCEPTED")}
                          className="rounded-[4px] bg-[#38BDF8] px-2.5 py-1 text-[11px] font-semibold text-black hover:bg-[#0284C7]"
                        >
                          Mark Accepted
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Business & Audit Context */}
            <div className="rounded-[8px] bg-(--n-15151f) border border-(--n-212132) p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-(--n-71717a) uppercase font-mono font-bold">
                  AI Audit Findings & Proof Focus
                </span>
                <span className="text-xs font-bold text-(--accent) font-mono">
                  Score: {selectedLead.fitScore || selectedLead.leadScore || 85}/100
                </span>
              </div>
              <p className="text-xs text-(--n-d4d4d8) leading-relaxed">
                {selectedLead.auditFindings ||
                  "Verified online presence; lacks high-converting short-form creative and clear visual branding proof."}
              </p>
              <div className="text-[11px] text-(--n-71717a) flex items-center justify-between pt-2 border-t border-(--n-1f1f2e)">
                <span>Contact: {selectedLead.contactName || "Owner not verified"}</span>
                <span className="font-mono text-white">{realEmail(selectedLead.contactEmail, selectedLead.email) ?? "No verified email"}</span>
              </div>
            </div>

            {/* REAL CONVERSATION THREAD */}
            <div className="rounded-[8px] bg-(--n-15151f) border border-(--n-212132) p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-(--n-71717a) uppercase font-mono font-bold flex items-center gap-1.5">
                  <MessageSquare className="size-3 text-[#38BDF8]" />
                  <span>Conversation History</span>
                </span>
                <span className="text-[10px] text-(--accent) bg-(--accent)/10 px-1.5 py-0.5 rounded">
                  Dual-Track Synced
                </span>
              </div>

              {/* Thread Messages */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto scrollbar-none py-1">
                {!selectedLead.messages || selectedLead.messages.length === 0 ? (
                  <p className="text-xs text-(--n-71717a) italic py-2">
                    No active email exchange yet. Pitch studio generated emails and incoming replies will appear here.
                  </p>
                ) : (
                  selectedLead.messages.map((m: any) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-[8px] text-xs max-w-[88%] space-y-1 ${
                        m.sender === "you"
                          ? "bg-(--n-1b1b29) text-(--n-e4e4e7) ml-auto border border-(--n-27273a)"
                          : "bg-(--n-171723) text-white border border-(--accent)/30 mr-auto"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-(--n-71717a) gap-4">
                        <span className="font-semibold text-white">
                          {m.sender === "you" ? "You" : selectedLead.contactName || "Prospect"}
                        </span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input Box */}
              {!selectedLead.isInBin && (
                <div className="pt-2 border-t border-(--n-1f1f2e) space-y-2">
                  <textarea
                    rows={2}
                    placeholder={`Write a direct reply to ${selectedLead.contactName || selectedLead.companyName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input bg-(--n-11111a) border-(--n-212132) text-xs text-white p-2.5 resize-none w-full"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="rounded-[6px] bg-(--accent) text-black font-semibold text-xs px-3.5 py-1.5 hover:bg-[#0EA5E9] disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      <Send className="size-3" />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stage Selector & Close */}
            <div className="flex items-center justify-between pt-2 border-t border-(--n-1e1e2d)">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-(--n-71717a)">Stage:</span>
                <select
                  value={selectedLead.status || selectedLead.stage || "NEW"}
                  onChange={(e) => handleUpdateStage(selectedLead.id, e.target.value)}
                  className="input bg-(--n-15151f) border-(--n-212132) text-xs text-white h-8"
                >
                  <option value="NEW">New</option>
                  <option value="RESEARCHED">Researched</option>
                  <option value="DRAFT_READY">Draft Ready</option>
                  <option value="INITIAL_SENT">Initial Sent</option>
                  <option value="FOLLOW_UP_DUE">Follow-Up Due</option>
                  <option value="REPLIED">Replied</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="MEETING_BOOKED">Meeting Booked</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-xs text-(--n-71717a) hover:text-white"
              >
                Close Drawer
              </button>
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
            fetchLeads(activeTab, searchQuery);
          }}
        />
      )}

      {/* Dynamic Proposal Viewer & Approval Modal */}
      {showProposalModal && activeProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[10px] border border-(--n-29293d) bg-(--n-13131d) p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-(--n-212132) pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-(--accent)" />
                <h2 className="text-sm font-bold text-white">Client Proposal &amp; Quote</h2>
                <span className="text-[10px] font-mono bg-(--accent)/20 text-(--accent) px-2 py-0.5 rounded">
                  {activeProposal.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="text-(--n-71717a) hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-[6px] bg-(--n-171723) border border-(--n-232335) space-y-1.5">
                <div className="text-[11px] text-(--n-888888)">Service Package</div>
                <div className="text-sm font-bold text-white">{activeProposal.serviceName}</div>
                <div className="text-(--n-a1a1aa)">{activeProposal.scope}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-[6px] bg-(--n-171723) border border-(--n-232335)">
                  <div className="text-[10px] text-(--n-71717a) uppercase font-mono">Total Price</div>
                  <div className="text-base font-bold text-(--accent) mt-1">${activeProposal.totalPrice} USD</div>
                  <div className="text-[10px] text-(--n-888888) mt-0.5">
                    Advance: ${activeProposal.advanceAmount} ({activeProposal.advancePercent}%)
                  </div>
                </div>

                <div className="p-3 rounded-[6px] bg-(--n-171723) border border-(--n-232335)">
                  <div className="text-[10px] text-(--n-71717a) uppercase font-mono">Deliverables &amp; Proof</div>
                  <div className="text-white mt-1">{activeProposal.revisionsIncluded} Included Revisions</div>
                  <a
                    href={activeProposal.caseStudyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#38BDF8] hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>View Behance Case Study</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-(--n-212132)">
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="rounded-[6px] border border-(--n-2c2c42) px-3.5 py-1.5 text-xs text-(--n-888888) hover:text-white"
              >
                Close
              </button>
              {activeProposal.status === "DRAFT" && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateProposalStatus(activeProposal.id, "SENT");
                    setShowProposalModal(false);
                  }}
                  className="rounded-[6px] bg-(--accent) px-4 py-1.5 text-xs font-semibold text-black hover:bg-[#0EA5E9]"
                >
                  Approve &amp; Send Proposal
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
