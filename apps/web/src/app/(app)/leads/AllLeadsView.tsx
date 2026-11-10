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
          clientEmail: lead.contactEmail || lead.email || "client@prospect.com",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">All Leads CRM</h1>
            <span className="text-[10px] font-mono uppercase bg-[#1A1A1A] text-[#10B981] px-2 py-0.5 rounded border border-[#2A2A2A]">
              7-Day Lifecycle Protected
            </span>
          </div>
          <p className="text-xs text-[#888888] mt-0.5">
            Deduplicated contact memory, 3-day follow-up triggers, automatic 7-day archival, and Lead Bin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search companies or emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 bg-[#141414] border-[#222222] text-xs text-white h-8 w-full"
            />
          </form>

          <button
            type="button"
            onClick={() => fetchLeads(activeTab, searchQuery)}
            className="p-2 rounded-[6px] bg-[#141414] border border-[#222222] text-[#888888] hover:text-white"
            title="Refresh leads"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-[#10B981]" : ""}`} />
          </button>

          <Link
            href="/pitch-studio"
            className="rounded-[6px] bg-[#10B981] px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-[#0EA5E9] transition-all shrink-0 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>New Pitch</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1F1F1F] overflow-x-auto pb-1 scrollbar-none">
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
                    : "bg-[#1F1F1F] text-white border border-[#333333] font-semibold"
                  : "text-[#888888] hover:text-white hover:bg-[#141414] border border-transparent"
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
      <div className="rounded-[10px] border border-[#1F1F1F] bg-[#111111] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A1A1AA]">
            <thead className="bg-[#141414] text-[#71717A] text-[10px] font-semibold uppercase tracking-wider border-b border-[#1F1F1F]">
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
            <tbody className="divide-y divide-[#1F1F1F]">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#71717A]">
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
                  const contact = lead.contactName || "Decision Maker";
                  const email = lead.contactEmail || lead.email;
                  const industry = lead.industry || lead.niche || "Creative";
                  const loc = [lead.city, lead.country].filter(Boolean).join(", ") || "Global";
                  const score = lead.fitScore || lead.leadScore || 85;

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-[#161616] transition-colors cursor-pointer"
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
                        <span className="text-[11px] text-[#71717A] font-mono">{email || "No email"}</span>
                      </td>

                      <td className="px-4 py-3 text-[#D4D4D8]">{industry}</td>

                      <td className="px-4 py-3 text-[#71717A]">{loc}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{score}</span>
                          <div className="w-12 h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#10B981]"
                              style={{ width: `${Math.min(100, score)}%` }}
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
                              ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20"
                              : lead.status === "REPLIED" || lead.stage === "REPLIED"
                              ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                              : lead.status === "INITIAL_SENT" || lead.stage === "CONTACTED"
                              ? "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20"
                              : "bg-[#1F1F1F] text-[#888888]"
                          }`}
                        >
                          {lead.isInBin
                            ? "In Bin"
                            : lead.isArchived
                            ? "Archived"
                            : lead.status || lead.stage || "New"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-[11px] text-[#71717A]">
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
                                className="rounded-[4px] bg-[#1A1A1A] border border-[#2E2E2E] text-[#10B981] hover:bg-[#10B981]/10 text-[11px] px-2 py-1 flex items-center gap-1"
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
                                className="rounded-[4px] bg-[#1A1A1A] border border-[#2E2E2E] text-white hover:text-[#10B981] text-[11px] px-2 py-1 flex items-center gap-1"
                                title="Unarchive lead"
                              >
                                <ArchiveRestore className="size-3" />
                                <span>Unarchive</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => executeLeadAction("bin", lead.id)}
                                className="rounded-[4px] bg-[#1A1A1A] border border-[#2E2E2E] text-[#71717A] hover:text-[#EF4444] text-[11px] p-1"
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
                                    leadScore: score,
                                    auditFinding: lead.auditFindings,
                                    recommendedService: lead.recommendedService,
                                  });
                                }}
                                className="rounded-[4px] bg-[#10B981] text-black font-semibold text-[11px] px-2.5 py-1 hover:bg-[#0EA5E9] transition-all"
                              >
                                Pitch &rarr;
                              </button>
                              <button
                                type="button"
                                onClick={() => executeLeadAction("archive", lead.id)}
                                className="rounded-[4px] bg-[#1A1A1A] border border-[#2E2E2E] text-[#71717A] hover:text-white text-[11px] p-1"
                                title="Archive lead"
                              >
                                <Archive className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => executeLeadAction("bin", lead.id)}
                                className="rounded-[4px] bg-[#1A1A1A] border border-[#2E2E2E] text-[#71717A] hover:text-[#EF4444] text-[11px] p-1"
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
          <div className="w-full max-w-xl bg-[#111111] border-l border-[#1F1F1F] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-[8px] bg-[#1A1A1A] border border-[#2E2E2E] text-white font-bold text-sm">
                  {(selectedLead.companyName || selectedLead.businessName || "M").charAt(0)}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {selectedLead.companyName || selectedLead.businessName}
                  </h2>
                  <p className="text-xs text-[#888888]">
                    {selectedLead.industry || selectedLead.niche} &bull; {selectedLead.city}, {selectedLead.country}
                  </p>
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

            {/* Status & Suppression Bar */}
            <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#141414] border border-[#222222]">
              <div className="flex items-center gap-2">
                <Shield className="size-3.5 text-[#10B981]" />
                <span className="text-[11px] text-[#A1A1AA]">Lead State:</span>
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
                      className="text-[11px] text-[#888888] hover:text-white px-2 py-0.5 rounded bg-[#1C1C1C]"
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
                    className="text-[11px] text-[#10B981] hover:bg-[#10B981]/10 px-2 py-0.5 rounded"
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
                      email: selectedLead.contactEmail || selectedLead.email,
                      website: selectedLead.website,
                      niche: selectedLead.industry || selectedLead.niche,
                      city: selectedLead.city,
                      country: selectedLead.country,
                      leadScore: selectedLead.fitScore || selectedLead.leadScore,
                      auditFinding: selectedLead.auditFindings,
                      recommendedService: selectedLead.recommendedService,
                    });
                  }}
                  className="rounded-[6px] bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#0EA5E9] transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  <span>Generate Pitch</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateProposal(selectedLead.id, "logo_design")}
                  disabled={creatingProposal}
                  className="rounded-[6px] bg-[#181818] border border-[#282828] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222222] flex items-center gap-1.5"
                >
                  <FileText className="size-3.5 text-[#38BDF8]" />
                  <span>{creatingProposal ? "Creating..." : "Create Proposal"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickBookMeeting(selectedLead)}
                  disabled={schedulingMeeting}
                  className="rounded-[6px] bg-[#181818] border border-[#282828] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#222222] flex items-center gap-1.5"
                >
                  <CalendarCheck className="size-3.5 text-[#10B981]" />
                  <span>{schedulingMeeting ? "Booking Meet..." : "Book Google Meet"}</span>
                </button>
              </div>
            )}

            {meetingSlotNotice && (
              <div className="p-2.5 rounded-[6px] bg-[#10B981]/10 border border-[#10B981]/25 text-xs text-[#10B981]">
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
              <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#202020] pb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="size-3.5 text-[#10B981]" />
                    <span className="text-xs font-bold text-white">AI Sales Assistant</span>
                    <span className="text-[10px] bg-[#10B981]/15 text-[#10B981] px-2 py-0.5 rounded font-mono">
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
                  <div className="p-3 rounded-[6px] bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[#888888]">
                      <span>AI Proposed Response</span>
                      <span className="text-[#10B981]">Ready for approval</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed font-mono whitespace-pre-wrap">
                      {selectedLead.suggestedReply}
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#262626]">
                      <button
                        type="button"
                        onClick={() => setReplyText(selectedLead.suggestedReply)}
                        className="text-[11px] text-[#A1A1AA] hover:text-white px-2 py-1 rounded"
                      >
                        Copy to Input
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveReply(selectedLead.id, selectedLead.suggestedReply)}
                        disabled={sendingReply}
                        className="rounded-[6px] bg-[#10B981] px-3 py-1 text-xs font-semibold text-black hover:bg-[#0EA5E9]"
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
              <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#202020] pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="size-3.5 text-[#10B981]" />
                    <span>Active Proposals ({proposals.length})</span>
                  </span>
                </div>

                {proposals.map((prop: any) => (
                  <div
                    key={prop.id}
                    className="p-3 rounded-[6px] bg-[#181818] border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{prop.serviceName}</span>
                        <span className="text-[10px] font-mono bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded">
                          ${prop.totalPrice} USD
                        </span>
                        <span className="text-[10px] text-[#A1A1AA]">
                          Status: <strong className="text-white">{prop.status}</strong>
                        </span>
                      </div>
                      <div className="text-[11px] text-[#71717A] mt-1">
                        Advance: ${prop.advanceAmount} ({prop.advancePercent}%) &bull; {prop.revisionsIncluded} Revisions
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {prop.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateProposalStatus(prop.id, "SENT")}
                          className="rounded-[4px] bg-[#10B981] px-2.5 py-1 text-[11px] font-semibold text-black hover:bg-[#0EA5E9]"
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
            <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#71717A] uppercase font-mono font-bold">
                  AI Audit Findings & Proof Focus
                </span>
                <span className="text-xs font-bold text-[#10B981] font-mono">
                  Score: {selectedLead.fitScore || selectedLead.leadScore || 85}/100
                </span>
              </div>
              <p className="text-xs text-[#D4D4D8] leading-relaxed">
                {selectedLead.auditFindings ||
                  "Verified online presence; lacks high-converting short-form creative and clear visual branding proof."}
              </p>
              <div className="text-[11px] text-[#71717A] flex items-center justify-between pt-2 border-t border-[#202020]">
                <span>Contact: {selectedLead.contactName || "Decision Maker"}</span>
                <span className="font-mono text-white">{selectedLead.contactEmail || selectedLead.email || "No email"}</span>
              </div>
            </div>

            {/* REAL CONVERSATION THREAD */}
            <div className="rounded-[8px] bg-[#161616] border border-[#222222] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#71717A] uppercase font-mono font-bold flex items-center gap-1.5">
                  <MessageSquare className="size-3 text-[#38BDF8]" />
                  <span>Conversation History</span>
                </span>
                <span className="text-[10px] text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded">
                  Dual-Track Synced
                </span>
              </div>

              {/* Thread Messages */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto scrollbar-none py-1">
                {!selectedLead.messages || selectedLead.messages.length === 0 ? (
                  <p className="text-xs text-[#71717A] italic py-2">
                    No active email exchange yet. Pitch studio generated emails and incoming replies will appear here.
                  </p>
                ) : (
                  selectedLead.messages.map((m: any) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-[8px] text-xs max-w-[88%] space-y-1 ${
                        m.sender === "you"
                          ? "bg-[#1C1C1C] text-[#E4E4E7] ml-auto border border-[#282828]"
                          : "bg-[#181818] text-white border border-[#10B981]/30 mr-auto"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#71717A] gap-4">
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
                <div className="pt-2 border-t border-[#202020] space-y-2">
                  <textarea
                    rows={2}
                    placeholder={`Write a direct reply to ${selectedLead.contactName || selectedLead.companyName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input bg-[#121212] border-[#222222] text-xs text-white p-2.5 resize-none w-full"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="rounded-[6px] bg-[#10B981] text-black font-semibold text-xs px-3.5 py-1.5 hover:bg-[#0EA5E9] disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      <Send className="size-3" />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stage Selector & Close */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1F1F1F]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#71717A]">Stage:</span>
                <select
                  value={selectedLead.status || selectedLead.stage || "NEW"}
                  onChange={(e) => handleUpdateStage(selectedLead.id, e.target.value)}
                  className="input bg-[#161616] border-[#222222] text-xs text-white h-8"
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
                className="text-xs text-[#71717A] hover:text-white"
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
          <div className="w-full max-w-lg rounded-[10px] border border-[#2A2A2A] bg-[#141414] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#10B981]" />
                <h2 className="text-sm font-bold text-white">Client Proposal &amp; Quote</h2>
                <span className="text-[10px] font-mono bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded">
                  {activeProposal.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="text-[#71717A] hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-[6px] bg-[#181818] border border-[#242424] space-y-1.5">
                <div className="text-[11px] text-[#888888]">Service Package</div>
                <div className="text-sm font-bold text-white">{activeProposal.serviceName}</div>
                <div className="text-[#A1A1AA]">{activeProposal.scope}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-[6px] bg-[#181818] border border-[#242424]">
                  <div className="text-[10px] text-[#71717A] uppercase font-mono">Total Price</div>
                  <div className="text-base font-bold text-[#10B981] mt-1">${activeProposal.totalPrice} USD</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">
                    Advance: ${activeProposal.advanceAmount} ({activeProposal.advancePercent}%)
                  </div>
                </div>

                <div className="p-3 rounded-[6px] bg-[#181818] border border-[#242424]">
                  <div className="text-[10px] text-[#71717A] uppercase font-mono">Deliverables &amp; Proof</div>
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="rounded-[6px] border border-[#2E2E2E] px-3.5 py-1.5 text-xs text-[#888888] hover:text-white"
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
                  className="rounded-[6px] bg-[#10B981] px-4 py-1.5 text-xs font-semibold text-black hover:bg-[#0EA5E9]"
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
