import fs from "node:fs";
import { getDataFilePath } from "./data-dir";
import { ServicesEngine, type QuoteCalculationResult } from "./services-engine";
import { BehanceVault } from "./behance-vault";

export type ProposalStatus =
  | "DRAFT"
  | "NEEDS_INFO"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "CLIENT_ACCEPTED"
  | "CLIENT_REQUESTED_CHANGES"
  | "REJECTED"
  | "EXPIRED";

export interface ClientProposal {
  id: string;
  leadId: string;
  clientName: string;
  companyName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  projectTitle: string;
  projectSummary: string;
  requirements: string;
  deliverables: string[];
  conceptsCount: number;
  includedRevisions: number;
  timeline: string;
  currency: string;
  price: number;
  advancePayment: number;
  remainingBalance: number;
  optionalExtras: string[];
  assumptionsAndExclusions: string[];
  relevantBehanceProjectUrl: string;
  primaryBehanceProfileUrl: string;
  status: ProposalStatus;
  sentAt?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requiresOwnerApproval: boolean;
  approvalReasons: string[];
}

const PROPOSALS_FILE = getDataFilePath("miracle-proposals.json");

export class ProposalEngine {
  static getProposals(): ClientProposal[] {
    try {
      if (fs.existsSync(PROPOSALS_FILE)) {
        const raw = fs.readFileSync(PROPOSALS_FILE, "utf-8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (e) {
      console.error("Error reading proposals file:", e);
    }
    return [];
  }

  static saveProposals(proposals: ClientProposal[]) {
    fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(proposals, null, 2), "utf-8");
  }

  static getProposalsByLead(leadId: string): ClientProposal[] {
    return this.getProposals().filter((p) => p.leadId === leadId);
  }

  static getProposalById(id: string): ClientProposal | undefined {
    return this.getProposals().find((p) => p.id === id);
  }

  /**
   * Generates a tailored proposal from client requirements and configured pricing policy
   */
  static generateProposal(params: {
    leadId: string;
    clientName: string;
    companyName: string;
    clientEmail: string;
    serviceId?: string;
    niche?: string;
    clientBudget?: number;
    projectScopeNotes?: string;
    isRush?: boolean;
    extraRevisions?: number;
    selectedAddOnIds?: string[];
  }): ClientProposal {
    const services = ServicesEngine.getServices();
    let service = services.find((s) => s.id === params.serviceId);

    // Fallback detection based on niche/scope
    if (!service) {
      const scope = (params.projectScopeNotes || "").toLowerCase();
      if (scope.includes("video") || scope.includes("reel") || scope.includes("tiktok")) {
        service = services.find((s) => s.category === "Video") || services[0];
      } else if (scope.includes("brand") || scope.includes("identity")) {
        service = services.find((s) => s.category === "Branding") || services[0];
      } else {
        service = services.find((s) => s.id === "serv-logo-design") || services[0];
      }
    }

    // Run deterministic price calculation
    const quote = ServicesEngine.calculateQuote({
      serviceId: service.id,
      budget: params.clientBudget,
      complexity: "standard",
      isRush: params.isRush,
      extraRevisions: params.extraRevisions,
      selectedAddOnIds: params.selectedAddOnIds,
    });

    // Select niche-matched case study (WITHOUT modifying primary profile URL)
    const vault = BehanceVault.getVault();
    const matchedProject = BehanceVault.matchProjectForNiche(params.niche || service.name);

    const now = new Date().toISOString();
    const proposal: ClientProposal = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId: params.leadId,
      clientName: params.clientName,
      companyName: params.companyName,
      clientEmail: params.clientEmail,
      serviceId: service.id,
      serviceName: service.name,
      projectTitle: `${service.name} for ${params.companyName}`,
      projectSummary: `Custom ${service.name} engagement tailored to elevate ${params.companyName}'s brand presence and conversion rates.`,
      requirements: params.projectScopeNotes || `Aesthetic visual creative scope for ${params.companyName}.`,
      deliverables: quote.deliverables,
      conceptsCount: 2,
      includedRevisions: quote.totalRevisions,
      timeline: `${quote.turnaroundDays} business days${params.isRush ? " (Expedited Rush Delivery)" : ""}`,
      currency: "USD",
      price: quote.finalPrice,
      advancePayment: quote.advanceDue,
      remainingBalance: quote.balanceDue,
      optionalExtras: service.addOns.map((a) => `${a.name} (+$${a.price})`),
      assumptionsAndExclusions: [
        "Includes full commercial usage rights upon final payment balance settlement.",
        `Initial advance payment of $${quote.advanceDue} required prior to kickoff.`,
        "Additional revisions beyond the included tier are billed at $10 / iteration.",
      ],
      relevantBehanceProjectUrl: matchedProject.url,
      primaryBehanceProfileUrl: vault.primary_behance_profile_url,
      status: "DRAFT",
      requiresOwnerApproval: quote.requiresOwnerApproval,
      approvalReasons: quote.approvalReasons,
      createdAt: now,
      updatedAt: now,
    };

    // Top-level aliases for UI and API compatibility
    (proposal as any).totalPrice = proposal.price;
    (proposal as any).advanceAmount = proposal.advancePayment;
    (proposal as any).advancePercent = 50;
    (proposal as any).caseStudyUrl = proposal.relevantBehanceProjectUrl;
    (proposal as any).revisionsIncluded = proposal.includedRevisions;
    (proposal as any).scope = proposal.requirements;

    const existing = this.getProposals();
    existing.unshift(proposal);
    this.saveProposals(existing);
    return proposal;
  }

  /**
   * Updates an existing proposal
   */
  static updateProposal(id: string, updates: Partial<ClientProposal>): ClientProposal | null {
    const list = this.getProposals();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const updated = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    this.saveProposals(list);
    return updated;
  }
}
