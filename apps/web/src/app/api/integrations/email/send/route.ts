import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { SpamGuardEngine } from "@/lib/spam-guard";
import { verifyDomain } from "@/lib/dns-validator";
import { EmailLearningEngine } from "@/lib/email-learning-engine";
import { SafetyModeEngine } from "@/lib/safety-mode";
import { LeadMemoryEngine } from "@/lib/lead-memory-engine";
import { BehanceVault } from "@/lib/behance-vault";

export async function POST(req: Request) {
  let cleanRecipient = "";
  try {
    const body = await req.json();
    const {
      senderEmail,
      senderPassword,
      senderProvider = "gmail",
      senderHost,
      senderPort,
      senderName = "Zohaib",
      to,
      subject,
      content,
      body: rawBody,
      leadId,
      businessName,
      niche,
      country,
      city,
      portfolioUrl,
      calendarUrl,
    } = body;

    const emailContent = content || rawBody;

    if (!to || !subject || !emailContent) {
      return NextResponse.json(
        { ok: false, error: "Recipient email, subject, and content are required." },
        { status: 400 }
      );
    }

    cleanRecipient = String(to).trim();

    // Outbound Portfolio URL Authorization Guard
    const urlValidation = BehanceVault.validateDraftUrls(emailContent);
    if (!urlValidation.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: `Outbound Dispatch Blocked: Email contains unauthorized or fabricated portfolio link(s): ${urlValidation.unauthorizedUrls.join(", ")}. Only saved, authenticated portfolio URLs are permitted.`,
          code: "UNAUTHORIZED_PORTFOLIO_URL",
          unauthorizedUrls: urlValidation.unauthorizedUrls,
        },
        { status: 400 }
      );
    }

    // 1. Suppression Registry Check (Section 8 Mandate)
    const suppression = LeadMemoryEngine.isSuppressed(cleanRecipient);
    if (suppression.suppressed) {
      return NextResponse.json(
        {
          ok: false,
          error: `Contact is suppressed: Reason [${suppression.record?.reason}]. Outbound sending strictly prohibited.`,
          code: "CONTACT_SUPPRESSED",
          suppressionReason: suppression.record?.reason,
        },
        { status: 403 }
      );
    }

    // 2. Pre-Send MX / DNS Deliverability Quality Gate (RFC 5321/7505)
    const domainCheck = await verifyDomain(cleanRecipient);
    if (!domainCheck.hasMx || !domainCheck.valid) {
      if (leadId) {
        const lead = LeadMemoryEngine.getLeadById(leadId);
        if (lead) {
          LeadMemoryEngine.upsertLead({
            ...lead,
            emailStatus: domainCheck.status,
            verificationStatus: domainCheck.status,
            outreachStatus: `Ineligible: ${domainCheck.status}`,
          });
        }
      }

      return NextResponse.json(
        {
          ok: false,
          error: `Deliverability Pre-Check Blocked: Domain '${domainCheck.domain}' has no valid mail exchanger (${domainCheck.status}: ${domainCheck.error}). Outreach blocked to protect sender score.`,
          code: "DELIVERABILITY_PRECHECK_FAILED",
          domainStatus: domainCheck.status,
          details: domainCheck.details,
        },
        { status: 422 }
      );
    }

    // 3. Dual-Gate Server-Enforced Safety Mode Check (Section 1 Mandate)
    const safetyCheck = SafetyModeEngine.canSendLiveOutreach(cleanRecipient);

    // If Outreach is Paused (Emergency Stop)
    if (SafetyModeEngine.getSafetySettings().outreachPaused) {
      return NextResponse.json(
        {
          ok: false,
          error: "Emergency Stop is ACTIVE: All outbound outreach is currently paused.",
          code: "EMERGENCY_STOP_ACTIVE",
        },
        { status: 423 }
      );
    }

    // 4. Anti-Spam Scanner (SpamGuardEngine)
    const spamAnalysis = SpamGuardEngine.analyze(subject, emailContent);
    const finalSubject = spamAnalysis.cleanSubject;
    let finalContent = spamAnalysis.cleanBody;

    // 5. Register with Email Learning Engine & Tracking
    const trackingId = EmailLearningEngine.registerEmailSent({
      recipientEmail: cleanRecipient,
      businessName: businessName || cleanRecipient.split("@")[0],
      subject: finalSubject,
      niche,
      country,
      city,
    });

    const origin = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
    const baseUrl = origin.startsWith("http") ? origin : `http://${origin}`;
    const trackingPixelUrl = `${baseUrl}/api/track/open/${trackingId}.png`;

    if (portfolioUrl) {
      const trackedPortfolio = `${baseUrl}/api/track/click/${trackingId}?type=portfolio&target=${encodeURIComponent(portfolioUrl)}`;
      finalContent = finalContent.replace(portfolioUrl, trackedPortfolio);
    }

    if (calendarUrl) {
      const trackedCalendar = `${baseUrl}/api/track/click/${trackingId}?type=calendar&target=${encodeURIComponent(calendarUrl)}`;
      finalContent = finalContent.replace(calendarUrl, trackedCalendar);
    }

    const personalHtml = SpamGuardEngine.formatPersonalEmailHtml(finalContent, trackingPixelUrl);

    // 6. TESTING / DRY-RUN MODE SIMULATION HANDLING (Section 1 Mandate)
    if (safetyCheck.isSimulation) {
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Update lead status in Lead Memory to INITIAL_SENT (or simulation state)
      if (leadId) {
        LeadMemoryEngine.upsertLead({
          id: leadId,
          contactEmail: cleanRecipient,
          companyName: businessName || cleanRecipient.split("@")[0],
          status: "INITIAL_SENT",
          crmStatus: "INITIAL_SENT",
          initialSentAt: now.toISOString(),
          followUpDueAt: threeDaysLater.toISOString(),
          lastSimulatedAction: `Simulated Email Sent in TESTING mode at ${now.toLocaleTimeString()}`,
        });
      }

      return NextResponse.json({
        ok: true,
        simulated: true,
        status: "Simulated_Sent",
        mode: "TESTING",
        message: "Miracle is in TESTING / DRY-RUN Mode. Email generated and pipeline simulated. ZERO real prospect emails were delivered.",
        trackingId,
        recipient: cleanRecipient,
        subject: finalSubject,
        followUpDueAt: threeDaysLater.toISOString(),
        deliverabilityScore: spamAnalysis.score,
        spamRating: spamAnalysis.rating,
        triggersCleaned: spamAnalysis.spamTriggersFound,
        timestamp: now.toISOString(),
      });
    }

    // 7. REAL SENDING (Permitted ONLY for approved test addresses OR authorized LIVE_ACTIVE)
    if (!senderEmail || !senderPassword) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sender email account credentials missing in Settings.",
          code: "NO_SENDER_CONNECTED",
        },
        { status: 400 }
      );
    }

    const cleanEmail = String(senderEmail).trim();
    const cleanPassword = String(senderPassword).replace(/\s+/g, "").trim();

    let transporter: any;
    if (senderProvider === "gmail" || cleanEmail.endsWith("@gmail.com") || cleanEmail.endsWith("@googlemail.com")) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: cleanEmail, pass: cleanPassword },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
      });
    } else {
      const host = senderHost || "smtp.gmail.com";
      const port = senderPort ? Number(senderPort) : 465;
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: cleanEmail, pass: cleanPassword },
        connectionTimeout: 12000,
      });
    }

    const messageId = SpamGuardEngine.generateMessageId(cleanEmail);

    const info = await transporter.sendMail({
      from: `"${senderName}" <${cleanEmail}>`,
      to: cleanRecipient,
      replyTo: cleanEmail,
      subject: finalSubject,
      text: finalContent,
      html: personalHtml,
      messageId,
      date: new Date(),
      headers: {
        "X-Entity-Ref-ID": trackingId,
        "X-Mailer": "Miracle OS 4.0",
      },
    });

    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (leadId) {
      LeadMemoryEngine.upsertLead({
        id: leadId,
        contactEmail: cleanRecipient,
        companyName: businessName || cleanRecipient.split("@")[0],
        status: "INITIAL_SENT",
        crmStatus: "INITIAL_SENT",
        initialSentAt: now.toISOString(),
        followUpDueAt: threeDaysLater.toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      simulated: false,
      status: "Sent",
      messageId: info.messageId || messageId,
      trackingId,
      recipient: cleanRecipient,
      sender: cleanEmail,
      followUpDueAt: threeDaysLater.toISOString(),
      deliverabilityScore: spamAnalysis.score,
      spamRating: spamAnalysis.rating,
      triggersCleaned: spamAnalysis.spamTriggersFound,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    const responseCode = err?.responseCode || err?.code;
    const msg = String(err?.message || "").toLowerCase();
    const isPermanentBounce =
      responseCode === 550 ||
      responseCode === 551 ||
      responseCode === 553 ||
      responseCode === 554 ||
      msg.includes("user unknown") ||
      msg.includes("mailbox unavailable") ||
      msg.includes("recipient rejected");

    if (isPermanentBounce && typeof cleanRecipient === "string" && cleanRecipient.includes("@")) {
      LeadMemoryEngine.suppressEmail(
        cleanRecipient,
        cleanRecipient.split("@")[1] || "domain.com",
        "HARD_BOUNCE",
        `Confirmed SMTP Permanent Bounce: Code ${responseCode || "550"} - ${err.message}`
      );
    }

    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected server error", isPermanentBounce: Boolean(isPermanentBounce) },
      { status: isPermanentBounce ? 422 : 500 }
    );
  }
}
