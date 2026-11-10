import { NextResponse, type NextRequest } from "next/server";
import { LeadMemoryEngine } from "@/lib/lead-memory-engine";
import { BehanceVault } from "@/lib/behance-vault";
import { verifyDomain } from "@/lib/dns-validator";
import { discoverAuthenticBusinesses } from "@/lib/authentic-discovery";
import { calculateQualificationScore } from "@/lib/qualification-scoring";

// In-memory state for background discovery jobs
let currentJob = {
  id: "job-idle",
  status: "idle", // "idle" | "running" | "paused" | "completed" | "search_limit_reached" | "stopped"
  requestedValidLeads: 5,
  readyContacts: 0,
  needResearch: 0,
  invalidOrSuppressed: 0,
  locationRejected: 0,
  businessesScanned: 0,
  contactQualityRate: 0,
  currentNiche: "Gyms & Fitness Centers",
  currentCity: "Riyadh",
  currentCountry: "Saudi Arabia",
  discoveryMode: "verified_only", // "verified_only" | "all_businesses"
  startedAt: null as string | null,
  completedAt: null as string | null,
  completionReason: null as string | null,
  statusMessage: "Ready to discover qualified leads.",
  error: null as string | null,
};

export async function GET() {
  return NextResponse.json({ ok: true, job: currentJob });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, country, city, niche, targetCount, leadCount, discoveryMode } = body;

    if (action === "start") {
      const countParam = targetCount ?? leadCount ?? 5;
      const target = Math.max(1, Math.min(250, Number(countParam) || 5));
      const chosenCountry = country || "Saudi Arabia";
      const chosenCity = city || "Riyadh";
      const chosenNiche = niche || "Gyms & Fitness Centers";
      const mode = discoveryMode === "all_businesses" ? "all_businesses" : "verified_only";

      currentJob = {
        id: "job-" + Date.now(),
        status: "running",
        requestedValidLeads: target,
        readyContacts: 0,
        needResearch: 0,
        invalidOrSuppressed: 0,
        locationRejected: 0,
        businessesScanned: 0,
        contactQualityRate: 0,
        currentCountry: chosenCountry,
        currentCity: chosenCity,
        currentNiche: chosenNiche,
        discoveryMode: mode,
        startedAt: new Date().toISOString(),
        completedAt: null,
        completionReason: null,
        statusMessage: `Finding ${target} location-verified business contacts in ${chosenCity}, ${chosenCountry}...`,
        error: null,
      };

      // 1. Authoritative Portfolio URL
      const portfolioUrl = BehanceVault.getPrimaryProfileUrl() || "";

      // 2. Fetch Authentic Location-Verified Business Candidates
      const discoveryResult = await discoverAuthenticBusinesses({
        niche: chosenNiche,
        city: chosenCity,
        country: chosenCountry,
        maxToScan: Math.max(target * 2, 20),
      });

      const candidates = discoveryResult.candidates;
      let locationRejectedCount = discoveryResult.locationRejectedCount;

      const existingLeads = LeadMemoryEngine.getLeads();
      const existingEmails = new Set(
        existingLeads.map((l) => (l.contactEmail || l.email || "").toLowerCase().trim()).filter(Boolean)
      );
      const existingCompanies = new Set(
        existingLeads.map((l) => (l.companyName || l.businessName || "").toLowerCase().trim()).filter(Boolean)
      );

      const newlyAddedLeads: any[] = [];
      let readyCount = 0;
      let needResearchCount = 0;
      let invalidCount = 0;
      let scannedCount = 0;

      // 3. Lead Verification Loop
      // User requested `target` valid leads -> Loop until target is met or candidates are exhausted!
      for (const candidate of candidates) {
        if (readyCount >= target) {
          break; // Exact target reached!
        }

        scannedCount++;
        const rawEmail = (candidate.contactEmail || "").toLowerCase().trim();
        const compName = candidate.businessName.trim();

        // Check if already in CRM
        const isDuplicateCompany = existingCompanies.has(compName.toLowerCase());
        const isDuplicateEmail = rawEmail ? existingEmails.has(rawEmail) : false;

        let emailStatus: any = "NO_EMAIL_FOUND";
        let verificationStatus: any = "NO_EMAIL_FOUND";
        let outreachStatus = "Email Missing - Needs Research";
        let isEligible = false;
        let dnsDetails = "";
        let hasVerifiedMx = false;

        if (!rawEmail) {
          // NO GUESSED EMAILS: Keep business in CRM with NO_EMAIL_FOUND
          emailStatus = "NO_EMAIL_FOUND";
          verificationStatus = "NO_EMAIL_FOUND";
          outreachStatus = "Email Missing - Needs Research";
          needResearchCount++;
        } else if (LeadMemoryEngine.isSuppressed(rawEmail).suppressed) {
          // Suppressed contact
          emailStatus = "SUPPRESSED";
          verificationStatus = "SUPPRESSED";
          outreachStatus = "Contact Suppressed - Prohibited";
          invalidCount++;
        } else if (isDuplicateEmail) {
          // Duplicate contact
          emailStatus = "DUPLICATE";
          verificationStatus = "DUPLICATE";
          outreachStatus = "Duplicate Contact - Already in CRM";
          invalidCount++;
        } else {
          // Genuine DNS & MX Deliverability Pre-Check
          const check = await verifyDomain(rawEmail);
          dnsDetails = check.details || check.error || "";
          hasVerifiedMx = check.valid && Boolean(check.hasMx);

          if (hasVerifiedMx) {
            emailStatus = "VERIFIED";
            verificationStatus = "VERIFIED";
            outreachStatus = "Ready to Send";
            isEligible = true;
            readyCount++;
            existingEmails.add(rawEmail);
          } else if (check.status === "NULL_MX") {
            emailStatus = "NULL_MX";
            verificationStatus = "NULL_MX";
            outreachStatus = "Null MX - Email Inactive";
            invalidCount++;
          } else if (check.status === "TEMPORARY_DNS_ERROR") {
            emailStatus = "TEMPORARY_DNS_ERROR";
            verificationStatus = "TEMPORARY_DNS_ERROR";
            outreachStatus = "Verifying - Temporary DNS Delay";
            needResearchCount++;
          } else {
            emailStatus = "INVALID_DOMAIN";
            verificationStatus = "INVALID_DOMAIN";
            outreachStatus = "Invalid Domain - No MX Exchanger";
            invalidCount++;
          }
        }

        existingCompanies.add(compName.toLowerCase());

        // Calculate Deterministic Qualification Score
        const qualification = calculateQualificationScore({
          locationConfidence: candidate.locationConfidence || "HIGH",
          locationMatched: true,
          industryMatched: true,
          hasNicheSpecialization: true,
          emailStatus,
          hasVerifiedMx,
          hasAuditFindings: Boolean(candidate.auditFindings),
          hasHttpsWebsite: candidate.website.startsWith("https://"),
          hasDirectPhone: Boolean(candidate.phone),
        });

        const leadId = `lead-${Date.now()}-${scannedCount}`;
        const newLeadRecord = LeadMemoryEngine.upsertLead({
          id: leadId,
          companyName: compName,
          businessName: compName,
          contactName: candidate.contactName || "Management Team",
          contactEmail: rawEmail || "",
          email: rawEmail || "",
          emailStatus,
          verificationStatus,
          outreachStatus,
          industry: chosenNiche,
          niche: chosenNiche,
          city: candidate.city || chosenCity,
          country: candidate.country || chosenCountry,
          address: candidate.address || "",
          phone: candidate.phone || "",
          website: candidate.website,
          leadScore: qualification.totalScore,
          leadGrade: qualification.grade,
          scoreBreakdown: qualification.breakdown,
          status: "NEW",
          crmStatus: "NEW",
          stage: isEligible ? "QUALIFIED" : "DISCOVERED",
          researchSummary: `Verified physical operation in ${candidate.city || chosenCity}, ${candidate.country || chosenCountry}. ${candidate.auditFindings}`,
          auditFindings: candidate.auditFindings,
          recommendedService: candidate.recommendedService,
          matchedBehanceTitle: "Behance Creative Portfolio",
          matchedBehanceUrl: portfolioUrl,
          lastActivityAt: "Just now",
          nextFollowUp: isEligible ? "Generate AI Pitch" : "Research Contact Email",
          messages: [],
          source: candidate.emailSourceType === "verified_directory" ? "Verified Business Directory" : "Pitch Studio Discovery",
          dnsCheckEvidence: dnsDetails,
        });

        newlyAddedLeads.push(newLeadRecord);
      }

      const qualityRate = scannedCount > 0 ? Math.round((readyCount / scannedCount) * 100) : 0;
      const targetReached = readyCount >= target;

      currentJob.readyContacts = readyCount;
      currentJob.needResearch = needResearchCount;
      currentJob.invalidOrSuppressed = invalidCount;
      currentJob.locationRejected = locationRejectedCount;
      currentJob.businessesScanned = scannedCount;
      currentJob.contactQualityRate = qualityRate;
      currentJob.completedAt = new Date().toISOString();
      currentJob.status = targetReached ? "completed" : "search_limit_reached";
      currentJob.completionReason = targetReached ? "TARGET_REACHED" : "SEARCH_LIMIT_REACHED";
      currentJob.statusMessage = targetReached
        ? `${readyCount} / ${target} Verified Contacts Found — Ready for Outreach`
        : `${readyCount} / ${target} Verified Contacts Found — Search Limit Reached`;

      return NextResponse.json({
        ok: true,
        message: currentJob.statusMessage,
        job: currentJob,
        leadsGenerated: newlyAddedLeads.length,
        readyContactsCount: readyCount,
        leads: newlyAddedLeads,
      });
    }

    if (action === "pause") {
      currentJob.status = "paused";
      return NextResponse.json({ ok: true, message: "Discovery automation paused.", job: currentJob });
    }

    if (action === "resume") {
      currentJob.status = "running";
      return NextResponse.json({ ok: true, message: "Discovery automation resumed.", job: currentJob });
    }

    if (action === "stop") {
      currentJob.status = "stopped";
      return NextResponse.json({ ok: true, message: "Discovery automation stopped.", job: currentJob });
    }

    return NextResponse.json({ ok: true, job: currentJob });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
