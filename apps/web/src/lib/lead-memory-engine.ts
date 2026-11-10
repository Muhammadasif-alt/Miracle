import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type SuppressionReason =
  | "ALREADY_CONTACTED"
  | "NO_RESPONSE_SEQUENCE_COMPLETE"
  | "OPTED_OUT"
  | "NOT_INTERESTED"
  | "HARD_BOUNCE"
  | "MANUALLY_BLOCKED"
  | "PERMANENT_DELETION_PROTECTION";

export interface SuppressionRecord {
  emailHash: string;
  normalizedEmail: string;
  domain: string;
  reason: SuppressionReason;
  suppressedAt: string;
  notes?: string;
}

export type LeadCrmStatus =
  | "NEW"
  | "RESEARCHED"
  | "DRAFT_READY"
  | "INITIAL_SENT"
  | "AWAITING_REPLY"
  | "FOLLOW_UP_DUE"
  | "FOLLOW_UP_SENT"
  | "REPLIED"
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "MEETING_BOOKED"
  | "ARCHIVED"
  | "BIN"
  | "TEST_SIMULATED";

export interface LeadRecord {
  id: string;
  companyName: string;
  businessName?: string;
  normalizedCompany: string;
  domain: string;
  contactName?: string;
  contactEmail: string;
  email?: string;
  contactRole?: string;
  industry: string;
  niche?: string;
  country: string;
  city?: string;
  website?: string;
  businessDescription?: string;
  researchSummary?: string;
  auditFindings?: string;
  recommendedService?: string;
  leadScore?: number;
  fitScore?: number;
  stage?: string;
  outreachStatus?: string;
  creativeOpportunity?: string;
  applicableServices?: string[];
  lastResearchedAt?: string;
  status: LeadCrmStatus;
  crmStatus: LeadCrmStatus;
  isArchived: boolean;
  archiveReason?: string;
  isInBin: boolean;
  binTimestamp?: string | null;
  keepActive?: boolean;
  messages?: any[];
  gmailThreadId?: string | null;
  initialSentAt?: string | null;
  followUpDueAt?: string | null;
  followUpSentAt?: string | null;
  autoArchiveDueAt?: string | null;
  replyDetectedAt?: string | null;
  replyClassification?: string | null;
  meetingBookedAt?: string | null;
  lastSimulatedAction?: string | null;
  portfolioSnapshotUrl?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

import { getDataFilePath } from "./data-dir";

const LEADS_FILE = getDataFilePath("miracle-leads.json");
const SUPPRESSION_FILE = getDataFilePath("miracle-suppression-registry.json");
const HMAC_SECRET = process.env.SUPPRESSION_HMAC_SECRET || "miracle-v4-secure-suppression-salt-2026";

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export class LeadMemoryEngine {
  static hashEmail(email: string): string {
    const norm = email.toLowerCase().trim();
    return crypto.createHmac("sha256", HMAC_SECRET).update(norm).digest("hex");
  }

  static getSuppressionRegistry(): SuppressionRecord[] {
    try {
      if (fs.existsSync(SUPPRESSION_FILE)) {
        return JSON.parse(fs.readFileSync(SUPPRESSION_FILE, "utf-8"));
      }
    } catch {}
    return [];
  }

  static saveSuppressionRegistry(records: SuppressionRecord[]) {
    ensureDir(SUPPRESSION_FILE);
    fs.writeFileSync(SUPPRESSION_FILE, JSON.stringify(records, null, 2), "utf-8");
  }

  static isSuppressed(email: string): { suppressed: boolean; record?: SuppressionRecord } {
    const hash = this.hashEmail(email);
    const registry = this.getSuppressionRegistry();
    const found = registry.find((r) => r.emailHash === hash);
    if (found) {
      return { suppressed: true, record: found };
    }
    return { suppressed: false };
  }

  static suppressEmail(email: string, domain: string, reason: SuppressionReason, notes?: string) {
    const hash = this.hashEmail(email);
    const registry = this.getSuppressionRegistry();
    const existingIndex = registry.findIndex((r) => r.emailHash === hash);
    const record: SuppressionRecord = {
      emailHash: hash,
      normalizedEmail: email.toLowerCase().trim(),
      domain: domain.toLowerCase().trim(),
      reason,
      suppressedAt: new Date().toISOString(),
      notes,
    };

    if (existingIndex >= 0) {
      registry[existingIndex] = record;
    } else {
      registry.push(record);
    }
    this.saveSuppressionRegistry(registry);
  }

  static unsuppressEmail(email: string): boolean {
    const hash = this.hashEmail(email);
    const registry = this.getSuppressionRegistry();
    const filtered = registry.filter((r) => r.emailHash !== hash);
    if (filtered.length !== registry.length) {
      this.saveSuppressionRegistry(filtered);
      return true;
    }
    return false;
  }

  static getLeads(): LeadRecord[] {
    try {
      if (fs.existsSync(LEADS_FILE)) {
        return JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"));
      }
    } catch {}
    return [];
  }

  static saveLeads(leads: LeadRecord[]) {
    ensureDir(LEADS_FILE);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  }

  static getLeadById(id: string): LeadRecord | undefined {
    return this.getLeads().find((l) => l.id === id);
  }

  static upsertLead(leadData: Partial<LeadRecord> & { contactEmail?: string; companyName?: string }): LeadRecord {
    const leads = this.getLeads();
    const rawEmail = leadData.contactEmail || (leadData as any).email || "";
    const normEmail = rawEmail ? rawEmail.toLowerCase().trim() : `unknown-${Date.now()}@domain.com`;
    const rawCompany = leadData.companyName || (leadData as any).businessName || "Unnamed Business";
    const normCompany = rawCompany.toLowerCase().trim();

    const existingIndex = leads.findIndex((l) => {
      const email = l.contactEmail || (l as any).email;
      return email ? email.toLowerCase().trim() === normEmail : false;
    });

    const now = new Date().toISOString();
    let updatedLead: LeadRecord;

    if (existingIndex >= 0) {
      // Preserve prior research and history if not explicitly provided
      const existing = leads[existingIndex];
      updatedLead = {
        ...existing,
        ...leadData,
        companyName: rawCompany || existing.companyName,
        normalizedCompany: normCompany || existing.normalizedCompany,
        contactEmail: normEmail || existing.contactEmail,
        domain: leadData.domain || existing.domain || (leadData.website ? new URL(leadData.website).hostname.replace("www.", "") : ""),
        updatedAt: now,
      };
      leads[existingIndex] = updatedLead;
    } else {
      updatedLead = {
        ...leadData,
        id: leadData.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        companyName: rawCompany,
        normalizedCompany: normCompany,
        domain: leadData.domain || (leadData.website ? new URL(leadData.website).hostname.replace("www.", "") : "unknown.com"),
        contactName: leadData.contactName || "Team Lead",
        contactEmail: normEmail,
        contactRole: leadData.contactRole || "Creative Director",
        industry: leadData.industry || (leadData as any).niche || "General",
        country: leadData.country || "United States",
        city: leadData.city || "New York",
        website: leadData.website || "",
        businessDescription: leadData.businessDescription || "",
        researchSummary: leadData.researchSummary || "",
        creativeOpportunity: leadData.creativeOpportunity || "",
        applicableServices: leadData.applicableServices || [],
        status: leadData.status || "NEW",
        crmStatus: leadData.crmStatus || "NEW",
        isArchived: false,
        isInBin: false,
        binTimestamp: null,
        keepActive: false,
        source: leadData.source || "Manual Discovery",
        createdAt: now,
        updatedAt: now,
      };
      leads.push(updatedLead);
    }

    this.saveLeads(leads);
    return updatedLead;
  }

  /* -------------------------------------------------------------------------
   * LEAD BIN & LIFECYCLE ACTIONS
   * ------------------------------------------------------------------------- */
  static moveToBin(id: string): boolean {
    const leads = this.getLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return false;

    lead.isInBin = true;
    lead.binTimestamp = new Date().toISOString();
    lead.status = "BIN";
    lead.crmStatus = "BIN";
    lead.updatedAt = new Date().toISOString();
    this.saveLeads(leads);
    return true;
  }

  static restoreFromBin(id: string): boolean {
    const leads = this.getLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return false;

    lead.isInBin = false;
    lead.binTimestamp = null;
    lead.status = lead.lastResearchedAt ? "RESEARCHED" : "NEW";
    lead.crmStatus = lead.status;
    lead.updatedAt = new Date().toISOString();
    this.saveLeads(leads);
    return true;
  }

  static archiveLead(id: string): boolean {
    const leads = this.getLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return false;

    lead.isArchived = true;
    lead.status = "ARCHIVED";
    lead.crmStatus = "ARCHIVED";
    lead.updatedAt = new Date().toISOString();
    this.saveLeads(leads);
    return true;
  }

  static unarchiveLead(id: string): boolean {
    const leads = this.getLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return false;

    lead.isArchived = false;
    lead.status = "RESEARCHED";
    lead.crmStatus = "RESEARCHED";
    lead.updatedAt = new Date().toISOString();
    this.saveLeads(leads);
    return true;
  }

  static permanentlyDeleteLead(id: string): boolean {
    const leads = this.getLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return false;

    // MANDATE §6: Preserve only minimal pseudonymized suppression to prevent re-contacting
    this.suppressEmail(
      lead.contactEmail,
      lead.domain,
      "PERMANENT_DELETION_PROTECTION",
      "Purged by user permanent delete — suppression preserved to prevent duplicate outreach"
    );

    const filtered = leads.filter((l) => l.id !== id);
    this.saveLeads(filtered);
    return true;
  }

  /* -------------------------------------------------------------------------
   * AUTOMATIC 7-DAY CLEANUP & 3-DAY FOLLOWUP SCHEDULE
   * ------------------------------------------------------------------------- */
  static runLifecycleCheck(): {
    followUpsDue: LeadRecord[];
    archivedCount: number;
  } {
    const leads = this.getLeads();
    const now = Date.now();
    const followUpsDue: LeadRecord[] = [];
    let archivedCount = 0;

    for (const lead of leads) {
      if (lead.isInBin || lead.isArchived || lead.keepActive) continue;

      // Check exclusions: Replied, Interested, Meeting Booked
      if (
        lead.status === "REPLIED" ||
        lead.status === "INTERESTED" ||
        lead.status === "MEETING_BOOKED" ||
        lead.replyDetectedAt ||
        lead.meetingBookedAt
      ) {
        continue;
      }

      // 1. Initial Sent -> Follow-up eligibility (72h / 3 days)
      if (lead.status === "INITIAL_SENT" && lead.initialSentAt) {
        const sentTime = new Date(lead.initialSentAt).getTime();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (now - sentTime >= threeDaysMs && !lead.followUpSentAt) {
          lead.status = "FOLLOW_UP_DUE";
          lead.crmStatus = "FOLLOW_UP_DUE";
          lead.followUpDueAt = new Date(sentTime + threeDaysMs).toISOString();
          followUpsDue.push(lead);
        }
      }

      // 2. Follow-up Sent -> 7-Day Auto Archive if no reply
      if (lead.status === "FOLLOW_UP_SENT" && lead.followUpSentAt) {
        const followUpTime = new Date(lead.followUpSentAt).getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (now - followUpTime >= sevenDaysMs) {
          lead.isArchived = true;
          lead.status = "ARCHIVED";
          lead.crmStatus = "ARCHIVED";
          lead.autoArchiveDueAt = new Date().toISOString();
          // Suppress to prevent duplicate future cold campaigns
          this.suppressEmail(
            lead.contactEmail,
            lead.domain,
            "NO_RESPONSE_SEQUENCE_COMPLETE",
            "Auto-archived after 1 follow-up and 7 days with no response"
          );
          archivedCount++;
        }
      }
    }

    if (followUpsDue.length > 0 || archivedCount > 0) {
      this.saveLeads(leads);
    }

    return { followUpsDue, archivedCount };
  }
}
