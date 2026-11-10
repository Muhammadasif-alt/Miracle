import { NextResponse, type NextRequest } from "next/server";
import { ProposalEngine } from "@/lib/proposal-engine";
import { LeadMemoryEngine } from "@/lib/lead-memory-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");

    const proposals = leadId
      ? ProposalEngine.getProposalsByLead(leadId)
      : ProposalEngine.getProposals();

    return NextResponse.json({ ok: true, proposals });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, proposalId, leadId, proposalData, updates } = body;

    // 1. Generate Proposal
    if (action === "generate") {
      const data = proposalData || body;
      const lead = data.leadId ? (LeadMemoryEngine.getLeadById(data.leadId) as any) : null;
      const clientName = data.clientName || lead?.contactName || lead?.companyName || "Creative Partner";
      const companyName = data.companyName || lead?.companyName || "Client Business";
      const clientEmail = data.clientEmail || lead?.contactEmail || lead?.email || "partner@prospect.com";

      const generated = ProposalEngine.generateProposal({
        leadId: data.leadId || "lead-default",
        clientName,
        companyName,
        clientEmail,
        serviceId: data.serviceId || (data.serviceKey === "logo_design" ? "serv-logo-design" : undefined),
        niche: data.niche || lead?.industry,
        clientBudget: Number(data.customPrice || data.clientBudget || 0),
        projectScopeNotes: data.scope || data.projectScopeNotes,
      });

      if (data.customPrice && Number(data.customPrice) >= 5) {
        generated.price = Number(data.customPrice);
        generated.advancePayment = Number(data.customPrice) * 0.5;
        (generated as any).totalPrice = generated.price;
        (generated as any).advanceAmount = generated.advancePayment;
        ProposalEngine.updateProposal(generated.id, {
          price: generated.price,
          advancePayment: generated.advancePayment,
        });
      }

      return NextResponse.json({ ok: true, proposal: generated });
    }

    // 2. Update Proposal
    if (action === "update" && proposalId && updates) {
      const updated = ProposalEngine.updateProposal(proposalId, updates);
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, proposal: updated });
    }

    // 3. Owner Approve Proposal
    if (action === "approve" && proposalId) {
      const updated = ProposalEngine.updateProposal(proposalId, {
        status: "APPROVED",
        requiresOwnerApproval: false,
      });
      return NextResponse.json({ ok: true, proposal: updated, message: "Proposal approved." });
    }

    // 4. Send Proposal to Client (appends to CRM lead conversation thread)
    if (action === "send" && proposalId) {
      const prop = ProposalEngine.getProposalById(proposalId);
      if (!prop) {
        return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
      }

      const updated = ProposalEngine.updateProposal(proposalId, {
        status: "SENT",
        sentAt: new Date().toISOString(),
      });

      // Append proposal notice to lead conversation
      if (prop.leadId) {
        const lead: any = LeadMemoryEngine.getLeadById(prop.leadId);
        if (lead) {
          const msgs = lead.messages || [];
          msgs.push({
            id: `msg-prop-${Date.now()}`,
            sender: "you",
            text: `[OFFICIAL PROPOSAL SENT]\nProject: ${prop.projectTitle}\nTotal Investment: $${prop.price} USD (Advance: $${prop.advancePayment}, Balance on Delivery: $${prop.remainingBalance})\nIncluded Deliverables: ${prop.deliverables.join(", ")}\nTimeline: ${prop.timeline}\nPortfolio Case Study: ${prop.relevantBehanceProjectUrl}`,
            timestamp: "Just now",
          });

          LeadMemoryEngine.upsertLead({
            ...lead,
            status: "DRAFT_READY",
            crmStatus: "DRAFT_READY",
            messages: msgs,
            lastSimulatedAction: `Proposal sent: $${prop.price} USD`,
          });
        }
      }

      return NextResponse.json({
        ok: true,
        proposal: updated,
        message: `Proposal officially submitted to ${prop.clientName} (${prop.companyName})!`,
      });
    }

    // 5. Client Accept Proposal
    if (action === "accept" && proposalId) {
      const prop = ProposalEngine.getProposalById(proposalId);
      if (!prop) {
        return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
      }

      const updated = ProposalEngine.updateProposal(proposalId, {
        status: "CLIENT_ACCEPTED",
        acceptedAt: new Date().toISOString(),
      });
      if (updated) {
        (updated as any).status = "ACCEPTED";
      }

      // Update CRM lead
      if (prop.leadId) {
        const lead: any = LeadMemoryEngine.getLeadById(prop.leadId);
        if (lead) {
          const msgs = lead.messages || [];
          msgs.push({
            id: `msg-accept-${Date.now()}`,
            sender: "lead",
            text: `Proposal accepted! Let's proceed with the kickoff.`,
            timestamp: "Just now",
          });

          LeadMemoryEngine.upsertLead({
            ...lead,
            status: "INTERESTED",
            crmStatus: "INTERESTED",
            messages: msgs,
            lastSimulatedAction: `Proposal accepted ($${prop.price} USD)`,
          });
        }
      }

      return NextResponse.json({
        ok: true,
        proposal: updated,
        message: `Proposal accepted by client! Status updated to Interested / Won.`,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
