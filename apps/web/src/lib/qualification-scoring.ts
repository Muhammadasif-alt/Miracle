/**
 * Deterministic Qualification Scoring Engine for Miracle
 * Replaces all pseudo-random score generation with four transparent pillars.
 */

export interface QualificationScoreBreakdown {
  locationMatch: number; // Max 25
  industryMatch: number; // Max 25
  deliverability: number; // Max 30
  websiteAudit: number; // Max 20
}

export interface QualificationScoreResult {
  totalScore: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  breakdown: QualificationScoreBreakdown;
  isOutreachReady: boolean;
  qualificationNotes: string[];
}

export interface QualificationInput {
  locationConfidence?: "HIGH" | "MEDIUM" | "LOW" | "MISMATCH";
  locationMatched?: boolean;
  industryMatched?: boolean;
  hasNicheSpecialization?: boolean;
  emailStatus?: string; // "VERIFIED" | "NO_EMAIL_FOUND" | "SUPPRESSED" | "INVALID_DOMAIN" | "NULL_MX" | "TEMPORARY_DNS_ERROR"
  hasVerifiedMx?: boolean;
  hasAuditFindings?: boolean;
  hasHttpsWebsite?: boolean;
  hasDirectPhone?: boolean;
}

export function calculateQualificationScore(input: QualificationInput): QualificationScoreResult {
  const notes: string[] = [];
  let locationPoints = 0;
  let industryPoints = 0;
  let deliverabilityPoints = 0;
  let websiteAuditPoints = 0;

  // 1. Pillar: Location Match (Max 25)
  if (input.locationConfidence === "HIGH") {
    locationPoints = 25;
    notes.push("Location: High confidence verified physical presence in target city (+25)");
  } else if (input.locationConfidence === "MEDIUM" || input.locationMatched) {
    locationPoints = 20;
    notes.push("Location: Verified regional matching (+20)");
  } else if (input.locationConfidence === "LOW") {
    locationPoints = 10;
    notes.push("Location: Low confidence geographic match (+10)");
  } else {
    locationPoints = 0;
    notes.push("Location: Mismatch or unverified location (+0)");
  }

  // 2. Pillar: Industry & Niche Match (Max 25)
  if (input.industryMatched !== false) {
    if (input.hasNicheSpecialization) {
      industryPoints = 25;
      notes.push("Industry: Exact specialized niche fit with targeted creative needs (+25)");
    } else {
      industryPoints = 20;
      notes.push("Industry: Core industry sector match (+20)");
    }
  } else {
    industryPoints = 0;
    notes.push("Industry: Outside core ICP target (+0)");
  }

  // 3. Pillar: Contact Deliverability (Max 30) - CRITICAL FOR SENDING
  const status = (input.emailStatus || "").toUpperCase();
  if (status === "VERIFIED" && input.hasVerifiedMx !== false) {
    deliverabilityPoints = 30;
    notes.push("Deliverability: Active mailbox with confirmed MX exchangers (+30)");
  } else if (status === "TEMPORARY_DNS_ERROR") {
    deliverabilityPoints = 10;
    notes.push("Deliverability: Mailbox pending DNS verification (+10)");
  } else if (status === "NO_EMAIL_FOUND") {
    deliverabilityPoints = 0;
    notes.push("Deliverability: No contact email identified (+0)");
  } else {
    deliverabilityPoints = 0;
    notes.push(`Deliverability: Suppressed or invalid domain [${status}] (+0)`);
  }

  // 4. Pillar: Website & Digital Presence Audit (Max 20)
  if (input.hasHttpsWebsite) {
    websiteAuditPoints += 10;
  }
  if (input.hasAuditFindings) {
    websiteAuditPoints += 10;
    notes.push("Website Audit: Verified brand assets and actionable outreach pitch angles (+20)");
  } else {
    notes.push("Website Audit: Baseline digital asset review (+10)");
  }

  // Compute Total
  let total = locationPoints + industryPoints + deliverabilityPoints + websiteAuditPoints;

  // STRICT QUALITY CAPS:
  // - A lead without deliverable email CANNOT score above 50!
  if (deliverabilityPoints === 0 && total > 50) {
    total = 50;
    notes.push("Quality Cap: Score capped at 50 due to missing or undeliverable contact mailbox.");
  }

  // - A lead with location mismatch CANNOT score above 20!
  if (input.locationConfidence === "MISMATCH" && total > 20) {
    total = 20;
    notes.push("Quality Cap: Score capped at 20 due to geographical location mismatch.");
  }

  // Determine Grade
  let grade: QualificationScoreResult["grade"] = "F";
  if (total >= 90) grade = "A+";
  else if (total >= 80) grade = "A";
  else if (total >= 70) grade = "B";
  else if (total >= 60) grade = "C";
  else if (total >= 50) grade = "D";
  else grade = "F";

  const isOutreachReady = deliverabilityPoints === 30 && locationPoints >= 20 && total >= 75;

  return {
    totalScore: Math.round(total),
    grade,
    breakdown: {
      locationMatch: locationPoints,
      industryMatch: industryPoints,
      deliverability: deliverabilityPoints,
      websiteAudit: websiteAuditPoints,
    },
    isOutreachReady,
    qualificationNotes: notes,
  };
}
