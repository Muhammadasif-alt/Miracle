import fs from "node:fs";
import { getDataFilePath } from "./data-dir";
import { ServicesEngine } from "./services-engine";
import { BehanceVault } from "./behance-vault";
import { LeadMemoryEngine, type LeadRecord } from "./lead-memory-engine";
import { AIRouter } from "./ai-router";

export type ClientIntent =
  | "SERVICE_INQUIRY"
  | "PRICING_INQUIRY"
  | "BUDGET_NEGOTIATION"
  | "PORTFOLIO_REQUEST"
  | "MEETING_REQUEST"
  | "REVISION_INQUIRY"
  | "TIMELINE_INQUIRY"
  | "OBJECTION"
  | "UNSUBSCRIBE"
  | "GENERAL";

export type AgentResponseMode = "DRAFT_ONLY" | "SMART_AUTO_REPLY" | "ADVANCED_AUTO_REPLY";

export interface ConversationAgentSettings {
  mode: AgentResponseMode;
  autoReplyToNewResponses: boolean;
  answerPortfolioQuestions: boolean;
  discussConfiguredServices: boolean;
  discussApprovedPriceRanges: boolean;
  generateCustomProposals: boolean;
  autoSendInPolicyQuotes: boolean;
  suggestMeetings: boolean;
  bookConfirmedMeetings: boolean;
  escalateUnknownRequests: boolean;
  requireApprovalForDiscounts: boolean;
  requireApprovalForUnusualTerms: boolean;
  emergencyPause: boolean;
  dailyAutoReplyLimit: number;
}

export interface AgentProcessingResult {
  ok: boolean;
  intent: ClientIntent;
  confidence: number;
  extractedBudget?: number;
  extractedService?: string;
  proposedReply: string;
  actionTaken: "REPLY_SENT" | "DRAFT_SAVED" | "ESCALATED_TO_OWNER" | "UNSUBSCRIBE_PROCESSED" | "EMERGENCY_PAUSED";
  requiresApproval: boolean;
  approvalReason?: string;
  suggestedAction?: "CREATE_PROPOSAL" | "SCHEDULE_MEETING" | "FLAG_REVIEW";
  matchedPortfolioUrl?: string;
}

const AGENT_SETTINGS_FILE = getDataFilePath("miracle-agent-settings.json");

export const DEFAULT_AGENT_SETTINGS: ConversationAgentSettings = {
  mode: "SMART_AUTO_REPLY",
  autoReplyToNewResponses: true,
  answerPortfolioQuestions: true,
  discussConfiguredServices: true,
  discussApprovedPriceRanges: true,
  generateCustomProposals: true,
  autoSendInPolicyQuotes: false, // Default: require explicit approval for final binding proposals
  suggestMeetings: true,
  bookConfirmedMeetings: true,
  escalateUnknownRequests: true,
  requireApprovalForDiscounts: true,
  requireApprovalForUnusualTerms: true,
  emergencyPause: false,
  dailyAutoReplyLimit: 50,
};

export class ConversationAgent {
  static getSettings(): ConversationAgentSettings {
    try {
      if (fs.existsSync(AGENT_SETTINGS_FILE)) {
        const raw = fs.readFileSync(AGENT_SETTINGS_FILE, "utf-8");
        return { ...DEFAULT_AGENT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.error("Error reading agent settings:", e);
    }
    return DEFAULT_AGENT_SETTINGS;
  }

  static saveSettings(settings: Partial<ConversationAgentSettings>): ConversationAgentSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    fs.writeFileSync(AGENT_SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  }

  /**
   * Classify client intent from their latest message
   */
  static classifyIntent(messageText: string): { intent: ClientIntent; budget?: number; serviceName?: string } {
    const text = (messageText || "").toLowerCase().trim();

    // 1. Opt-out / Unsubscribe
    if (text.includes("unsubscribe") || text.includes("remove me") || text.includes("stop emailing") || text.includes("not interested")) {
      return { intent: "UNSUBSCRIBE" };
    }

    // 2. Extract budget if present ($20, 20 dollars, budget is 50, etc.)
    let budget: number | undefined;
    const budgetMatch = text.match(/\$\s*(\d+)/) || text.match(/(\d+)\s*(dollars|usd|bucks)/);
    if (budgetMatch && budgetMatch[1]) {
      budget = parseInt(budgetMatch[1], 10);
    }

    // 3. Meeting / Call Intent
    if (text.includes("call") || text.includes("meet") || text.includes("zoom") || text.includes("google meet") || text.includes("chat on") || text.includes("calendar")) {
      return { intent: "MEETING_REQUEST", budget };
    }

    // 4. Budget / Negotiation Intent
    if (budget !== undefined || text.includes("my budget is") || text.includes("can you do") || text.includes("discount") || text.includes("negotiat")) {
      return { intent: "BUDGET_NEGOTIATION", budget };
    }

    // 5. Pricing Inquiry
    if (text.includes("how much") || text.includes("cost") || text.includes("pricing") || text.includes("rate") || text.includes("quote")) {
      return { intent: "PRICING_INQUIRY" };
    }

    // 6. Portfolio Inquiry
    if (text.includes("portfolio") || text.includes("work") || text.includes("sample") || text.includes("examples") || text.includes("behance") || text.includes("past project")) {
      return { intent: "PORTFOLIO_REQUEST" };
    }

    // 7. Service Inquiry
    if (text.includes("logo") || text.includes("video") || text.includes("edit") || text.includes("design") || text.includes("brand") || text.includes("reels") || text.includes("website")) {
      let serviceName = "Creative Design";
      if (text.includes("logo")) serviceName = "Logo Design";
      else if (text.includes("video") || text.includes("reel")) serviceName = "High-Converting Video Editing";
      else if (text.includes("brand")) serviceName = "Brand Identity System";
      return { intent: "SERVICE_INQUIRY", serviceName };
    }

    // 8. Revision Inquiry
    if (text.includes("revision") || text.includes("change") || text.includes("edit")) {
      return { intent: "REVISION_INQUIRY" };
    }

    // 9. Timeline Inquiry
    if (text.includes("how long") || text.includes("when can") || text.includes("turnaround") || text.includes("deadline") || text.includes("delivery")) {
      return { intent: "TIMELINE_INQUIRY" };
    }

    return { intent: "GENERAL" };
  }

  /**
   * Main intelligent processor for incoming client messages
   */
  static async handleIncomingMessage(params: {
    leadId: string;
    incomingMessageText: string;
    overrideMode?: AgentResponseMode;
  }): Promise<AgentProcessingResult> {
    let lead: any = LeadMemoryEngine.getLeadById(params.leadId);
    if (!lead) {
      lead = {
        id: params.leadId,
        companyName: "Prospective Client",
        contactName: "Prospect",
        contactEmail: "client@prospect.com",
        industry: "Creative & Technology",
        niche: "Creative & Technology",
        status: "IN_CONVERSATION",
        messages: [],
      };
      LeadMemoryEngine.upsertLead(lead);
    }

    const agentSettings = this.getSettings();
    const effectiveMode = params.overrideMode || agentSettings.mode;

    // 1. Check Emergency Pause
    if (agentSettings.emergencyPause) {
      return {
        ok: true,
        intent: "GENERAL",
        confidence: 1.0,
        proposedReply: "Emergency pause active. No automatic replies dispatched.",
        actionTaken: "EMERGENCY_PAUSED",
        requiresApproval: true,
        approvalReason: "Emergency Stop is active. Automated outbound actions halted.",
      };
    }

    const { intent, budget, serviceName } = this.classifyIntent(params.incomingMessageText);
    const vault = BehanceVault.getVault();
    const proof = BehanceVault.resolvePortfolioProof(lead.industry || lead.niche || "Creative");
    const services = ServicesEngine.getServices();
    const matchedService = services.find((s) => s.name === serviceName) || services[0];

    // 2. Handle Unsubscribe Request Immediately
    if (intent === "UNSUBSCRIBE") {
      const email = lead.contactEmail || lead.email;
      if (email) {
        LeadMemoryEngine.suppressEmail(email, lead.domain || "domain.com", "OPTED_OUT", "Client requested unsubscribe via email.");
      }
      return {
        ok: true,
        intent: "UNSUBSCRIBE",
        confidence: 1.0,
        proposedReply: "You have been successfully removed from our list. We will not contact you again.",
        actionTaken: "UNSUBSCRIBE_PROCESSED",
        requiresApproval: false,
      };
    }

    // 3. Anti-Loop Throttling Check
    const messages = lead.messages || [];
    if (messages.length >= 2) {
      const lastMsg = messages[messages.length - 1];
      const secondLastMsg = messages[messages.length - 2];
      if (lastMsg.sender === "you" && secondLastMsg.sender === "you") {
        return {
          ok: true,
          intent,
          confidence: 0.9,
          proposedReply: "Awaiting client response to avoid double-replying.",
          actionTaken: "ESCALATED_TO_OWNER",
          requiresApproval: true,
          approvalReason: "Anti-loop guard: Two consecutive outbound replies detected.",
        };
      }
    }

    // 4. Generate Context-Aware Response based on Intent & Business Policies
    let reply = "";
    let requiresApproval = effectiveMode === "DRAFT_ONLY";
    let approvalReason: string | undefined;
    let suggestedAction: "CREATE_PROPOSAL" | "SCHEDULE_MEETING" | "FLAG_REVIEW" | undefined;

    if (intent === "PRICING_INQUIRY") {
      reply = `Our configured pricing for ${matchedService.name} starts at $${matchedService.minPrice} and ranges to $${matchedService.maxPrice}, which includes ${matchedService.includedDeliverables.slice(0, 2).join(" and ")} with ${matchedService.includedRevisions} revisions included. We also require a ${matchedService.advancePaymentPercentage}% advance upon kickoff.\n\nCould you share a little about your preferred style so I can prepare an exact quote?`;
    } else if (intent === "BUDGET_NEGOTIATION") {
      const evalResult = ServicesEngine.evaluateNegotiation({
        serviceId: matchedService.id,
        clientBudget: budget,
        clientMessage: params.incomingMessageText,
      });

      reply = evalResult.counterOfferMessage;
      requiresApproval = evalResult.requiresOwnerApproval || effectiveMode !== "ADVANCED_AUTO_REPLY";
      if (evalResult.requiresOwnerApproval) {
        approvalReason = evalResult.approvalReason;
      }
      suggestedAction = "CREATE_PROPOSAL";
    } else if (intent === "PORTFOLIO_REQUEST") {
      if (proof.status === "MATCHED_PROJECT" && proof.title && proof.url) {
        reply = `You can explore my primary portfolio here:\n${vault.primary_behance_profile_url}\n\nI also have a specific relevant case study (${proof.title}) here:\n${proof.url}\n\nWould you like to focus on a similar visual direction for ${lead.companyName || lead.businessName}?`;
      } else if (vault.primary_behance_profile_url) {
        reply = `You can explore my creative work on my Behance profile here:\n${vault.primary_behance_profile_url}\n\nWould you like to focus on a similar visual direction for ${lead.companyName || lead.businessName}?`;
      } else {
        reply = `I would be happy to share my visual design and motion work with you. What specific style or references are you aiming for with ${lead.companyName || lead.businessName}?`;
      }
    } else if (intent === "SERVICE_INQUIRY") {
      reply = `Yes, we offer ${matchedService.name}. All projects include ${matchedService.includedDeliverables.join(", ")} with ${matchedService.includedRevisions} included revisions.\n\nDo you have an existing visual style or reference you are looking to match?`;
    } else if (intent === "MEETING_REQUEST") {
      reply = `I would be happy to discuss your project scope! I have open time slots tomorrow at 10:00 AM, 2:00 PM, or 4:30 PM (Eastern Time). Which of those works best for your schedule, or what timezone are you in?`;
      suggestedAction = "SCHEDULE_MEETING";
      requiresApproval = false;
    } else if (intent === "REVISION_INQUIRY") {
      reply = `Every standard ${matchedService.name} package includes ${matchedService.includedRevisions} revision rounds to ensure the final assets are dialed in. Additional revisions can be added at $${matchedService.additionalRevisionPrice} / iteration.`;
    } else if (intent === "TIMELINE_INQUIRY") {
      reply = `Our standard turnaround for ${matchedService.name} is ${matchedService.turnaroundDays} business days. We also offer expedited 24-hour delivery if you are on a tight deadline.`;
    } else {
      reply = `Thank you for reaching out! I've noted your feedback regarding ${lead.companyName || lead.businessName}. What is your target timeline for kicking this off?`;
    }

    // 5. Advanced Auto-Reply Execution vs Draft Saving
    let actionTaken: AgentProcessingResult["actionTaken"] = "DRAFT_SAVED";

    if (effectiveMode === "ADVANCED_AUTO_REPLY" && !requiresApproval) {
      actionTaken = "REPLY_SENT";
      // Record outgoing reply in lead's CRM messages
      const msgs = lead.messages || [];
      msgs.push({
        id: `msg-ai-${Date.now()}`,
        sender: "you",
        text: reply,
        timestamp: "Just now (AI Auto-Reply)",
      });

      LeadMemoryEngine.upsertLead({
        ...lead,
        messages: msgs,
        status: intent === "MEETING_REQUEST" ? "INTERESTED" : "REPLIED",
        crmStatus: intent === "MEETING_REQUEST" ? "INTERESTED" : "REPLIED",
        lastSimulatedAction: `AI auto-reply sent (${intent})`,
      });
    } else {
      actionTaken = requiresApproval ? "ESCALATED_TO_OWNER" : "DRAFT_SAVED";
    }

    return {
      ok: true,
      intent,
      confidence: 0.95,
      extractedBudget: budget,
      extractedService: matchedService.name,
      proposedReply: reply,
      actionTaken,
      requiresApproval,
      approvalReason,
      suggestedAction,
      matchedPortfolioUrl: proof.url || vault.primary_behance_profile_url || undefined,
    };
  }
}
