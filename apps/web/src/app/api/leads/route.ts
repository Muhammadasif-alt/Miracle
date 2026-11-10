import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { LeadMemoryEngine, type LeadRecord } from "@/lib/lead-memory-engine";

const LEADS_FILE = path.join(process.cwd(), ".data", "miracle-leads.json");

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Run 7-day lifecycle check automatically (Section 7 Mandate)
    LeadMemoryEngine.runLifecycleCheck();

    const { searchParams } = new URL(req.url);
    const tab = (searchParams.get("tab") || "ALL").toUpperCase();
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    let leads = LeadMemoryEngine.getLeads();

    // Text search query
    if (query) {
      leads = leads.filter(
        (l) =>
          (l.companyName || (l as any).businessName || "").toLowerCase().includes(query) ||
          (l.contactName || "").toLowerCase().includes(query) ||
          (l.contactEmail || (l as any).email || "").toLowerCase().includes(query) ||
          (l.industry || (l as any).niche || "").toLowerCase().includes(query) ||
          (l.city || "").toLowerCase().includes(query) ||
          (l.country || "").toLowerCase().includes(query)
      );
    }

    // Filter tab handling (Section 6 & 16 Mandates)
    if (tab === "ACTIVE") {
      leads = leads.filter((l) => !l.isInBin && !l.isArchived);
    } else if (tab === "NEW") {
      leads = leads.filter((l) => !l.isInBin && !l.isArchived && (l.status === "NEW" || (l as any).stage === "NEW" || (l as any).stage === "DISCOVERED"));
    } else if (tab === "RESEARCHED") {
      leads = leads.filter((l) => !l.isInBin && !l.isArchived && (l.status === "RESEARCHED" || (l as any).stage === "RESEARCHED"));
    } else if (tab === "CONTACTED") {
      leads = leads.filter((l) => !l.isInBin && !l.isArchived && (l.status === "INITIAL_SENT" || l.status === "FOLLOW_UP_SENT" || (l as any).stage === "SENT"));
    } else if (tab === "FOLLOW_UP_DUE") {
      leads = leads.filter((l) => !l.isInBin && !l.isArchived && l.status === "FOLLOW_UP_DUE");
    } else if (tab === "REPLIED") {
      leads = leads.filter((l) => !l.isInBin && !l.isArchived && (l.status === "REPLIED" || (l as any).stage === "REPLIED" || (l as any).stage === "IN_CONVERSATION"));
    } else if (tab === "INTERESTED") {
      leads = leads.filter((l) => !l.isInBin && !l.isArchived && (l.status === "INTERESTED" || (l as any).stage === "INTERESTED"));
    } else if (tab === "MEETINGS") {
      leads = leads.filter((l) => !l.isInBin && !l.isArchived && (l.status === "MEETING_BOOKED" || (l as any).stage === "MEETING_BOOKED"));
    } else if (tab === "ARCHIVED") {
      leads = leads.filter((l) => l.isArchived && !l.isInBin);
    } else if (tab === "BIN") {
      leads = leads.filter((l) => l.isInBin);
    } else {
      // "ALL" tab: displays active CRM leads (non-bin, non-archived by default)
      leads = leads.filter((l) => !l.isInBin && !l.isArchived);
    }

    return NextResponse.json({
      ok: true,
      count: leads.length,
      tab,
      leads,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, leadId, leadIds, lead, stage, messageText } = body;

    // 1. Lead Bin & Lifecycle Actions (Section 6 Mandate)
    if (action === "bin" && leadId) {
      LeadMemoryEngine.moveToBin(leadId);
      return NextResponse.json({ ok: true, message: "Lead moved to Bin successfully." });
    }

    if (action === "restore" && leadId) {
      LeadMemoryEngine.restoreFromBin(leadId);
      return NextResponse.json({ ok: true, message: "Lead restored from Bin to CRM." });
    }

    if (action === "archive" && leadId) {
      LeadMemoryEngine.archiveLead(leadId);
      return NextResponse.json({ ok: true, message: "Lead archived." });
    }

    if (action === "unarchive" && leadId) {
      LeadMemoryEngine.unarchiveLead(leadId);
      return NextResponse.json({ ok: true, message: "Lead unarchived." });
    }

    if (action === "permanent_delete" && leadId) {
      LeadMemoryEngine.permanentlyDeleteLead(leadId);
      return NextResponse.json({ ok: true, message: "Lead permanently deleted (suppression fingerprint preserved)." });
    }

    // Bulk Actions
    if (action === "bulk_bin" && Array.isArray(leadIds)) {
      leadIds.forEach((id: string) => LeadMemoryEngine.moveToBin(id));
      return NextResponse.json({ ok: true, count: leadIds.length });
    }

    if (action === "bulk_archive" && Array.isArray(leadIds)) {
      leadIds.forEach((id: string) => LeadMemoryEngine.archiveLead(id));
      return NextResponse.json({ ok: true, count: leadIds.length });
    }

    if (action === "bulk_permanent_delete" && Array.isArray(leadIds)) {
      leadIds.forEach((id: string) => LeadMemoryEngine.permanentlyDeleteLead(id));
      return NextResponse.json({ ok: true, count: leadIds.length });
    }

    // Update Stage / Status
    if (action === "update_stage" && leadId && stage) {
      const existing = LeadMemoryEngine.getLeadById(leadId);
      if (existing) {
        LeadMemoryEngine.upsertLead({
          ...existing,
          status: stage,
          crmStatus: stage,
          lastSimulatedAction: `Status updated to ${stage}`,
        });
      }
      return NextResponse.json({ ok: true, leads: LeadMemoryEngine.getLeads() });
    }

    // Add Message to Lead Conversation
    if (action === "send_reply" && leadId && messageText) {
      const existing: any = LeadMemoryEngine.getLeadById(leadId);
      if (existing) {
        const msgs = existing.messages || [];
        msgs.push({
          id: "m-" + Date.now(),
          sender: "you",
          text: messageText,
          timestamp: "Just now",
        });
        LeadMemoryEngine.upsertLead({
          ...existing,
          status: "REPLIED",
          crmStatus: "REPLIED",
          replyDetectedAt: new Date().toISOString(),
          messages: msgs,
        });
      }
      return NextResponse.json({ ok: true, leads: LeadMemoryEngine.getLeads() });
    }

    // Upsert Single Lead
    if (lead) {
      const saved = LeadMemoryEngine.upsertLead({
        ...lead,
        companyName: lead.companyName || lead.businessName,
        contactEmail: lead.contactEmail || lead.email,
      });
      return NextResponse.json({ ok: true, lead: saved });
    }

    return NextResponse.json({ ok: true, leads: LeadMemoryEngine.getLeads() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
