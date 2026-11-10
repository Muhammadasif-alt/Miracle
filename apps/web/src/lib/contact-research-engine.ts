import { verifyDomain, type DomainValidationResult } from "./dns-validator";
import { LeadMemoryEngine, type LeadRecord } from "./lead-memory-engine";
import * as cheerio from "cheerio";

export type ContactEligibilityStatus =
  | "READY"
  | "VERIFYING"
  | "EMAIL_MISSING"
  | "INVALID_DOMAIN"
  | "INVALID_SYNTAX"
  | "NULL_MX"
  | "TEMPORARY_DNS_ERROR"
  | "SUPPRESSED"
  | "NEEDS_RESEARCH";

export interface ContactEligibilityResult {
  eligible: boolean;
  status: ContactEligibilityStatus;
  badgeLabel: string;
  badgeColor: "green" | "yellow" | "red" | "zinc";
  reason: string;
  canSend: boolean;
  canResearch: boolean;
  domainCheck?: DomainValidationResult;
}

export class ContactResearchEngine {
  /**
   * Evaluates comprehensive contact eligibility before entering outreach sequence
   */
  static async evaluateLeadEligibility(lead: Partial<LeadRecord>): Promise<ContactEligibilityResult> {
    const rawEmail = (lead.contactEmail || lead.email || "").trim();

    // 1. Missing Email Check
    if (!rawEmail) {
      return {
        eligible: false,
        status: "EMAIL_MISSING",
        badgeLabel: "Email Missing",
        badgeColor: "yellow",
        reason: "No contact email address has been found or entered for this business.",
        canSend: false,
        canResearch: Boolean(lead.website),
      };
    }

    // 2. Suppression Registry Check (True Hard Bounces, Unsubscribes, DNC)
    const suppression = LeadMemoryEngine.isSuppressed(rawEmail);
    if (suppression.suppressed) {
      return {
        eligible: false,
        status: "SUPPRESSED",
        badgeLabel: "Suppressed",
        badgeColor: "red",
        reason: `Contact is suppressed: Reason [${suppression.record?.reason}]. Outbound outreach prohibited.`,
        canSend: false,
        canResearch: false,
      };
    }

    // 3. DNS / MX Deliverability Quality Check
    const domainCheck = await verifyDomain(rawEmail);

    if (domainCheck.status === "INVALID_EMAIL_SYNTAX") {
      return {
        eligible: false,
        status: "INVALID_SYNTAX",
        badgeLabel: "Invalid Email",
        badgeColor: "red",
        reason: "Email does not adhere to RFC 5322 syntax standards.",
        canSend: false,
        canResearch: Boolean(lead.website),
        domainCheck,
      };
    }

    if (domainCheck.status === "NULL_MX") {
      return {
        eligible: false,
        status: "NULL_MX",
        badgeLabel: "Null MX",
        badgeColor: "red",
        reason: "RFC 7505 Null MX: Domain explicitly declares it does not accept inbound email.",
        canSend: false,
        canResearch: Boolean(lead.website),
        domainCheck,
      };
    }

    if (domainCheck.status === "INVALID_DOMAIN") {
      return {
        eligible: false,
        status: "INVALID_DOMAIN",
        badgeLabel: "Invalid Domain",
        badgeColor: "red",
        reason: `Domain '${domainCheck.domain}' has no active MX mail exchangers in public DNS.`,
        canSend: false,
        canResearch: Boolean(lead.website),
        domainCheck,
      };
    }

    if (domainCheck.status === "TEMPORARY_DNS_ERROR") {
      return {
        eligible: false,
        status: "TEMPORARY_DNS_ERROR",
        badgeLabel: "Verifying",
        badgeColor: "yellow",
        reason: "DNS servers timed out or returned a temporary lookup error. Pending retry.",
        canSend: false,
        canResearch: false,
        domainCheck,
      };
    }

    if (domainCheck.status === "VALID_DOMAIN_UNVERIFIED_MAILBOX") {
      return {
        eligible: false,
        status: "NEEDS_RESEARCH",
        badgeLabel: "Unverified Host",
        badgeColor: "yellow",
        reason: "Domain has web A-records but no designated MX servers. Direct outreach held.",
        canSend: false,
        canResearch: Boolean(lead.website),
        domainCheck,
      };
    }

    // 4. Fully Verified & Eligible for Outreach
    return {
      eligible: true,
      status: "READY",
      badgeLabel: "Ready to Send",
      badgeColor: "green",
      reason: `Verified active mail exchangers: ${domainCheck.mxRecords.slice(0, 2).join(", ")}`,
      canSend: true,
      canResearch: false,
      domainCheck,
    };
  }

  /**
   * Researches official public website for published contact emails
   */
  static async researchWebsiteContact(websiteUrl: string): Promise<{
    found: boolean;
    email?: string;
    sourceUrl?: string;
    reason?: string;
    domainCheck?: DomainValidationResult;
  }> {
    if (!websiteUrl || !websiteUrl.startsWith("http")) {
      return { found: false, reason: "No valid website URL provided." };
    }

    const cleanBase = websiteUrl.replace(/\/+$/, "");
    const targets = [cleanBase, `${cleanBase}/contact`, `${cleanBase}/about`, `${cleanBase}/contact-us`];

    for (const url of targets) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Miracle/4.0 Business Contact Verifier",
            Accept: "text/html,application/xhtml+xml",
          },
        }).catch(() => null);

        clearTimeout(timeout);

        if (!res || !res.ok) continue;

        const html = await res.text();
        const $ = cheerio.load(html);

        // 1. Check direct mailto: links
        let candidateEmail = "";
        $('a[href^="mailto:"]').each((_, el) => {
          const href = $(el).attr("href") || "";
          const match = href.replace(/^mailto:/i, "").split("?")[0].trim();
          if (match && match.includes("@") && !match.includes("sentry") && !match.includes("wix")) {
            candidateEmail = match;
            return false;
          }
        });

        // 2. Scan text for standard email pattern if mailto not found
        if (!candidateEmail) {
          const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
          const matches = html.match(emailRegex) || [];
          for (const m of matches) {
            const lower = m.toLowerCase();
            if (
              !lower.endsWith(".png") &&
              !lower.endsWith(".jpg") &&
              !lower.includes("example.com") &&
              !lower.includes("domain.com")
            ) {
              candidateEmail = lower;
              break;
            }
          }
        }

        if (candidateEmail) {
          const check = await verifyDomain(candidateEmail);
          if (check.hasMx && check.valid) {
            return {
              found: true,
              email: candidateEmail,
              sourceUrl: url,
              domainCheck: check,
            };
          }
        }
      } catch {}
    }

    return { found: false, reason: "No verified public email address found on official website pages." };
  }

  /**
   * Re-evaluates a lead's contact eligibility and persists the updated classification
   */
  static async reverifyLeadRecord(leadId: string): Promise<LeadRecord | null> {
    const lead = LeadMemoryEngine.getLeadById(leadId);
    if (!lead) return null;

    const evaluation = await this.evaluateLeadEligibility(lead);

    const updated: LeadRecord = {
      ...lead,
      emailStatus: evaluation.status,
      verificationStatus: evaluation.status,
      outreachStatus: evaluation.badgeLabel,
      auditFindings: evaluation.reason ? `${lead.auditFindings || ""} [${evaluation.reason}]`.trim() : lead.auditFindings,
      updatedAt: new Date().toISOString(),
    };

    return LeadMemoryEngine.upsertLead(updated);
  }

  /**
   * Manually adds a verified email to a lead and performs instant MX validation
   */
  static async attachManualVerifiedEmail(
    leadId: string,
    email: string
  ): Promise<{ ok: boolean; lead?: LeadRecord; error?: string; domainCheck?: DomainValidationResult }> {
    const lead = LeadMemoryEngine.getLeadById(leadId);
    if (!lead) return { ok: false, error: "Lead not found in CRM." };

    const check = await verifyDomain(email);
    if (!check.valid || !check.hasMx) {
      return {
        ok: false,
        error: `Email deliverability check failed: ${check.error || "No active mail exchangers found"}`,
        domainCheck: check,
      };
    }

    const updated: LeadRecord = {
      ...lead,
      contactEmail: email.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      emailStatus: "VERIFIED",
      verificationStatus: "VERIFIED",
      outreachStatus: "Ready to Send",
      updatedAt: new Date().toISOString(),
      emailSource: {
        sourceType: "manual_verified",
        verifiedAt: new Date().toISOString(),
        mxExchange: check.mxRecords[0] || "",
      },
    };

    const saved = LeadMemoryEngine.upsertLead(updated);
    return { ok: true, lead: saved, domainCheck: check };
  }
}
