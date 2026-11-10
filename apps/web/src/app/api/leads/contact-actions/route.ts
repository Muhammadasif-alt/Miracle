import { NextResponse, type NextRequest } from "next/server";
import { ContactResearchEngine } from "@/lib/contact-research-engine";
import { LeadMemoryEngine } from "@/lib/lead-memory-engine";
import { findContactChannels } from "@/lib/contact-channels";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, leadId, email, websiteUrl } = body;

    if (!leadId) {
      return NextResponse.json({ ok: false, error: "Lead ID is required." }, { status: 400 });
    }

    const lead = LeadMemoryEngine.getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ ok: false, error: "Lead not found in CRM." }, { status: 404 });
    }

    // 1. Action: Re-evaluate & Reverify Deliverability
    if (action === "reverify") {
      const updated = await ContactResearchEngine.reverifyLeadRecord(leadId);
      return NextResponse.json({
        ok: true,
        message: `Lead deliverability reverified: ${updated?.outreachStatus || "Updated"}`,
        lead: updated,
      });
    }

    // Find every public contact channel (email, phone, Facebook, Instagram, LinkedIn) on the business website.
    // A fresh website check replaces earlier website findings; values from Google / OpenStreetMap are kept
    // when the website doesn't show that channel.
    if (action === "research_channels") {
      const site = websiteUrl || lead.website;
      const prev = lead.contactChannels ?? {};
      const found = site ? await findContactChannels(site) : { checkedAt: new Date().toISOString() };
      const keys = ["email", "phone", "facebook", "instagram", "linkedin"] as const;
      const fromWebsite = (k: (typeof keys)[number]) => prev[k]?.source.startsWith("Website") ?? false;
      const channels: NonNullable<typeof lead.contactChannels> = { checkedAt: found.checkedAt };
      for (const k of keys) {
        const v = found[k] ?? (fromWebsite(k) ? undefined : prev[k]);
        if (v) channels[k] = v;
      }
      const phone = channels.phone?.value ?? (fromWebsite("phone") ? undefined : lead.phone);
      const updated = LeadMemoryEngine.upsertLead({ ...lead, contactChannels: channels, phone });
      const n = (["email", "phone", "facebook", "instagram", "linkedin"] as const).filter((k) => channels[k]).length;
      return NextResponse.json({
        ok: true,
        found: n > 0,
        message: site ? `Found ${n} of 5 contact channels on the website.` : "No website on record — nothing to check.",
        lead: updated,
      });
    }

    // 2. Action: Research Website for Published Public Contact Email
    if (action === "research_website") {
      const site = websiteUrl || lead.website;
      if (!site) {
        return NextResponse.json(
          { ok: false, error: "This business does not have a recorded website URL." },
          { status: 400 }
        );
      }

      const researchResult = await ContactResearchEngine.researchWebsiteContact(site);
      if (researchResult.found && researchResult.email) {
        const updated = LeadMemoryEngine.upsertLead({
          ...lead,
          contactEmail: researchResult.email,
          email: researchResult.email,
          emailStatus: "VERIFIED",
          verificationStatus: "VERIFIED",
          outreachStatus: "Ready to Send",
          source: "Website Public Contact Research",
          updatedAt: new Date().toISOString(),
          emailSource: {
            sourceType: "website_contact",
            sourceUrl: researchResult.sourceUrl,
            verifiedAt: new Date().toISOString(),
          },
        });
        return NextResponse.json({
          ok: true,
          found: true,
          message: `Discovered published contact: ${researchResult.email}`,
          lead: updated,
        });
      }

      return NextResponse.json({
        ok: true,
        found: false,
        message: researchResult.reason || "No verified public contact email found on website.",
        lead,
      });
    }

    // 3. Action: Attach Manually Entered & Verified Email
    if (action === "attach_manual_email") {
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return NextResponse.json({ ok: false, error: "Valid email address required." }, { status: 400 });
      }

      const attachResult = await ContactResearchEngine.attachManualVerifiedEmail(leadId, email);
      if (!attachResult.ok) {
        return NextResponse.json(
          { ok: false, error: attachResult.error, domainCheck: attachResult.domainCheck },
          { status: 422 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `Verified email attached successfully: ${email}`,
        lead: attachResult.lead,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
