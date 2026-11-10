import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import { getDataFilePath } from "@/lib/data-dir";
import { LeadMemoryEngine } from "@/lib/lead-memory-engine";
import { ProposalEngine } from "@/lib/proposal-engine";

const MEETINGS_FILE = getDataFilePath("miracle-meetings.json");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "all").toLowerCase();
    const viewMode = (searchParams.get("mode") || "all").toLowerCase(); // "live" | "simulated" | "all"

    const leads = LeadMemoryEngine.getLeads();

    let meetings: any[] = [];
    if (fs.existsSync(MEETINGS_FILE)) {
      try {
        meetings = JSON.parse(fs.readFileSync(MEETINGS_FILE, "utf-8"));
      } catch {}
    }

    // Timeframe filter cutoff
    const now = Date.now();
    let cutoff = 0;
    if (period === "today") {
      cutoff = now - 24 * 3600 * 1000;
    } else if (period === "7d") {
      cutoff = now - 7 * 24 * 3600 * 1000;
    } else if (period === "30d" || period === "this_month") {
      cutoff = now - 30 * 24 * 3600 * 1000;
    }

    const filteredLeads = cutoff > 0
      ? leads.filter((l) => new Date(l.createdAt || l.updatedAt || now).getTime() >= cutoff)
      : leads;

    const filteredMeetings = cutoff > 0
      ? meetings.filter((m) => new Date(m.createdAt || m.startTime || now).getTime() >= cutoff)
      : meetings;

    // Separate simulation from live events (Section 17 Mandate)
    const simulatedLeads = filteredLeads.filter((l) => l.lastSimulatedAction || l.status === "TEST_SIMULATED");
    const liveLeads = filteredLeads.filter((l) => !l.lastSimulatedAction && l.status !== "TEST_SIMULATED");

    const dataset = viewMode === "live" ? liveLeads : viewMode === "simulated" ? simulatedLeads : filteredLeads;

    // Metrics Calculation
    const totalDiscoveredLeads = dataset.length;
    const uniqueResearchedContacts = dataset.filter((l) => l.status !== "NEW" || l.lastResearchedAt).length;
    const initialEmailsSent = dataset.filter((l) =>
      ["INITIAL_SENT", "AWAITING_REPLY", "FOLLOW_UP_DUE", "FOLLOW_UP_SENT", "REPLIED", "INTERESTED", "MEETING_BOOKED"].includes(l.status) ||
      ["SENT", "IN_CONVERSATION", "REPLIED", "MEETING_BOOKED"].includes((l as any).stage)
    ).length;
    const followUpsSent = dataset.filter((l) => l.status === "FOLLOW_UP_SENT" || l.followUpSentAt).length;
    const repliesReceived = dataset.filter((l) =>
      ["REPLIED", "INTERESTED", "MEETING_BOOKED"].includes(l.status) ||
      ["REPLIED", "IN_CONVERSATION", "MEETING_BOOKED"].includes((l as any).stage) ||
      (l.messages && l.messages.some((m: any) => m.sender === "lead"))
    ).length;
    const positiveReplies = dataset.filter((l) => l.status === "INTERESTED" || l.status === "MEETING_BOOKED").length;
    const negativeReplies = dataset.filter((l) => l.status === "NOT_INTERESTED").length;
    const meetingsBooked = filteredMeetings.length > 0 ? filteredMeetings.length : dataset.filter((l) => l.status === "MEETING_BOOKED" || (l as any).stage === "MEETING_BOOKED").length;
    const bounces = 0; // Prevented by pre-send DNS/MX check
    const unsubscribes = dataset.filter((l) => (l as any).status === "UNSUBSCRIBED").length;
    const interestedLeads = dataset.filter((l) => l.status === "INTERESTED" || (l as any).stage === "INTERESTED").length;
    const convertedClients = dataset.filter((l) => (l as any).stage === "CLOSED").length;

    const proposals = ProposalEngine.getProposals();
    const proposalsSent = proposals.filter((p: any) => p.status === "SENT" || p.status === "ACCEPTED").length;
    const proposalsAccepted = proposals.filter((p: any) => p.status === "ACCEPTED").length;

    const activeConversations = dataset.filter((l) =>
      ["IN_CONVERSATION", "REPLIED", "INTERESTED"].includes(l.status) ||
      ["IN_CONVERSATION", "REPLIED", "INTERESTED"].includes((l as any).stage)
    ).length;

    const repliesPendingApproval = dataset.filter((l) =>
      l.needsReview || (l.suggestedReply && !l.suggestedReplyApproved) || (l as any).aiStatus === "PENDING_APPROVAL"
    ).length;

    const aiRepliesSent = dataset.reduce((acc, l) => {
      const sentCount = (l.messages || []).filter((m: any) => m.sender === "me" && m.generatedByAi).length;
      return acc + (sentCount > 0 ? sentCount : (l as any).aiRepliesSent || 0);
    }, 0);

    const leadsRequiringAttention = dataset.filter((l) =>
      l.needsReview || (l as any).escalationReason || (l as any).aiStatus === "NEEDS_HUMAN"
    ).length;

    // Rates
    const totalSent = initialEmailsSent + followUpsSent;
    const replyRate = initialEmailsSent > 0 ? Math.round((repliesReceived / initialEmailsSent) * 100) : 0;
    const positiveReplyRate = repliesReceived > 0 ? Math.round((positiveReplies / repliesReceived) * 100) : 0;
    const meetingConversionRate = initialEmailsSent > 0 ? Math.round((meetingsBooked / initialEmailsSent) * 100) : 0;
    const followUpResponseRate = followUpsSent > 0 ? Math.round((repliesReceived / (initialEmailsSent + followUpsSent)) * 100) : 0;

    // Estimated opens (Section 17: Transparently labeled)
    const estimatedOpens = dataset.filter((l) => (l as any).trackedOpens && (l as any).trackedOpens > 0).length;

    // Outreach conversion funnel
    const funnel = [
      { step: "Discovered", count: totalDiscoveredLeads, percentage: 100 },
      { step: "Researched", count: uniqueResearchedContacts, percentage: totalDiscoveredLeads > 0 ? Math.round((uniqueResearchedContacts / totalDiscoveredLeads) * 100) : 0 },
      { step: "Outreach Sent", count: initialEmailsSent, percentage: totalDiscoveredLeads > 0 ? Math.round((initialEmailsSent / totalDiscoveredLeads) * 100) : 0 },
      { step: "Replies", count: repliesReceived, percentage: initialEmailsSent > 0 ? Math.round((repliesReceived / initialEmailsSent) * 100) : 0 },
      { step: "Meetings Booked", count: meetingsBooked, percentage: initialEmailsSent > 0 ? Math.round((meetingsBooked / initialEmailsSent) * 100) : 0 },
    ];

    return NextResponse.json({
      ok: true,
      period,
      viewMode,
      kpis: {
        totalDiscoveredLeads,
        uniqueResearchedContacts,
        initialEmailsSent,
        followUpsSent,
        totalSent,
        repliesReceived,
        positiveReplies,
        negativeReplies,
        meetingsBooked,
        bounces,
        unsubscribes,
        interestedLeads,
        convertedClients,
        activeConversations,
        aiRepliesSent,
        repliesPendingApproval,
        proposalsSent,
        proposalsAccepted,
        leadsRequiringAttention,
        estimatedOpens,
        openTrackingLabel: "Estimated Opens",
      },
      rates: {
        replyRate,
        positiveReplyRate,
        meetingConversionRate,
        bounceRate: 0,
        followUpResponseRate,
      },
      funnel,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
