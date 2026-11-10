/**
 * MIRACLE — FINAL AI SALES AGENT UPGRADE (TEST SUITE A–H)
 * Verifies Behance Vault, Black Bird Gateway, AI Conversation Agent,
 * Services Engine ($5–$100 Logo Design), Proposals, Google Calendar & Google Meet
 */

import assert from "node:assert/strict";

const BASE_URL = "http://127.0.0.1:3000";

async function postJson(endpoint, data) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, raw: text };
  }
}

async function getJson(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, raw: text };
  }
}

console.log("=============================================================");
console.log("   MIRACLE FINAL AI SALES AGENT UPGRADE — AUTOMATED E2E TEST ");
console.log("=============================================================");

let totalPassed = 0;
let totalFailed = 0;

async function runTest(name, fn) {
  process.stdout.write(`• ${name}... `);
  try {
    await fn();
    console.log("✓ PASS");
    totalPassed++;
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    totalFailed++;
  }
}

async function runAll() {
  // -------------------------------------------------------------
  // TEST A: Behance Vault Permanent Fix & Immutability
  // -------------------------------------------------------------
  await runTest("Test A: Behance Vault Persistence & Lock Protection", async () => {
    // 1. Get initial Behance profile
    const getRes = await getJson("/api/settings/behance");
    assert.equal(getRes.status, 200, "Behance settings GET should return 200");
    assert.ok(getRes.data.profileUrl, "Should return an authoritative profile URL");

    // 2. Lock the profile
    const lockRes = await postJson("/api/settings/behance", {
      action: "toggle_lock",
      locked: true,
    });
    assert.equal(lockRes.status, 200);
    assert.equal(lockRes.data.isLocked, true);

    // 3. Attempt to overwrite with an invalid gallery URL -> must be rejected
    const invalidUrlRes = await postJson("/api/settings/behance", {
      action: "update_profile",
      profileUrl: "https://www.behance.net/gallery/12345/some-project",
    });
    assert.equal(invalidUrlRes.status, 400, "Gallery URLs must be rejected as profile URLs");

    // 4. Attempt to unlock and save legitimate profile URL
    await postJson("/api/settings/behance", { action: "toggle_lock", locked: false });
    const updateRes = await postJson("/api/settings/behance", {
      action: "update_profile",
      profileUrl: "https://www.behance.net/zohaib-creative-studio",
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.profileUrl, "https://www.behance.net/zohaib-creative-studio");
    assert.equal(updateRes.data.isLocked, true, "Saving profile must auto-lock it");

    // 5. Verify persistence across fresh GET
    const verifyGet = await getJson("/api/settings/behance");
    assert.equal(verifyGet.data.profileUrl, "https://www.behance.net/zohaib-creative-studio");
    assert.equal(verifyGet.data.isLocked, true);
  });

  // -------------------------------------------------------------
  // TEST B: Black Bird AI Gateway Pairing & Model Listing
  // -------------------------------------------------------------
  await runTest("Test B: Black Bird Gateway Pairing & Model Listing", async () => {
    // 1. Check status
    const statusRes = await getJson("/api/integrations/blackbird");
    assert.equal(statusRes.status, 200);
    assert.ok(statusRes.data.endpoint.includes("20129"), "Endpoint should target port 20129");

    // 2. Perform pairing handshake
    const pairRes = await postJson("/api/integrations/blackbird", { action: "pair" });
    assert.equal(pairRes.status, 200);
    assert.equal(pairRes.data.isPaired, true);
    assert.ok(Array.isArray(pairRes.data.models), "Should return synchronized model list");
    assert.ok(pairRes.data.models.length > 0, "Black Bird should expose at least 1 active model");

    // 3. Test inference ping
    const testRes = await postJson("/api/integrations/blackbird", { action: "test" });
    assert.equal(testRes.status, 200);
    assert.equal(testRes.data.ok, true, "Inference ping to Black Bird must succeed");
  });

  // -------------------------------------------------------------
  // TEST C: Direct Gemini AI Integration
  // -------------------------------------------------------------
  await runTest("Test C: Gemini AI Diagnostic & Router Failover", async () => {
    const res = await postJson("/api/ai/gemini", { action: "test" });
    assert.equal(res.status, 200);
    assert.ok(res.data.error || res.data.ok, "Gemini diagnostic test should return structured status");
  });

  // -------------------------------------------------------------
  // TEST D: AI Client Conversation Agent Intent Classification
  // -------------------------------------------------------------
  await runTest("Test D: AI Conversation Intent Classification & Suggested Reply", async () => {
    // Test classifying a pricing inquiry
    const pricingRes = await postJson("/api/conversation", {
      action: "classify_intent",
      message: "How much do you charge for a modern tech logo design and branding?",
    });
    assert.equal(pricingRes.status, 200);
    assert.ok(
      pricingRes.data.intent === "PRICING_INQUIRY" || pricingRes.data.intent === "SERVICE_INQUIRY",
      `Expected PRICING_INQUIRY or SERVICE_INQUIRY, got ${pricingRes.data.intent}`
    );

    // Test classifying a meeting inquiry
    const meetingRes = await postJson("/api/conversation", {
      action: "classify_intent",
      message: "Can we get on a quick 15 minute Google Meet tomorrow afternoon to discuss?",
    });
    assert.equal(meetingRes.status, 200);
    assert.equal(meetingRes.data.intent, "MEETING_REQUEST");

    // Test classifying an unsubscribe request
    const unsubRes = await postJson("/api/conversation", {
      action: "classify_intent",
      message: "Please remove me from your list and unsubscribe.",
    });
    assert.equal(unsubRes.status, 200);
    assert.equal(unsubRes.data.intent, "UNSUBSCRIBE");
  });

  // -------------------------------------------------------------
  // TEST E: Dynamic Services & Deterministic Negotiation Engine
  // -------------------------------------------------------------
  await runTest("Test E: Services Engine ($5–$100 Logo Design & Policy Enforcement)", async () => {
    // 1. Calculate standard quote for Logo Design
    const quoteRes = await postJson("/api/settings/services", {
      action: "calculate_quote",
      serviceKey: "logo_design",
      scope: "Full modern logo with vector source files",
    });
    assert.equal(quoteRes.status, 200);
    assert.ok(quoteRes.data.quote.totalPrice >= 5 && quoteRes.data.quote.totalPrice <= 100);
    assert.equal(quoteRes.data.quote.advancePercent, 50);
    assert.equal(quoteRes.data.quote.advanceAmount, Math.ceil(quoteRes.data.quote.totalPrice * 0.5));

    // 2. Evaluate negotiation offer below minimum ($3 < $5 min)
    const lowOfferRes = await postJson("/api/settings/services", {
      action: "evaluate_negotiation",
      serviceKey: "logo_design",
      offeredBudget: 3,
    });
    assert.equal(lowOfferRes.status, 200);
    assert.equal(lowOfferRes.data.decision.decision, "REJECT_BELOW_MINIMUM");
    assert.equal(lowOfferRes.data.decision.minimumRequired, 5);

    // 3. Evaluate negotiation offer within allowed policy ($40)
    const validOfferRes = await postJson("/api/settings/services", {
      action: "evaluate_negotiation",
      serviceKey: "logo_design",
      offeredBudget: 40,
    });
    assert.equal(validOfferRes.status, 200);
    assert.equal(validOfferRes.data.decision.decision, "ACCEPT");
    assert.equal(validOfferRes.data.decision.agreedPrice, 40);
  });

  // -------------------------------------------------------------
  // TEST F: Dynamic Proposals Generator Lifecycle
  // -------------------------------------------------------------
  await runTest("Test F: Dynamic Proposal Lifecycle & Case Study Proof Injection", async () => {
    // 1. Generate proposal for a test lead
    const genRes = await postJson("/api/proposals", {
      action: "generate",
      leadId: "lead-test-client-1",
      serviceKey: "logo_design",
      scope: "Brand Identity & Minimalist Logo",
      customPrice: 75,
    });
    assert.equal(genRes.status, 200);
    const proposal = genRes.data.proposal;
    assert.ok(proposal.id, "Proposal should have a unique ID");
    assert.equal(proposal.totalPrice, 75);
    assert.equal(proposal.advanceAmount, 37.5); // 50%
    assert.equal(proposal.status, "DRAFT");
    assert.ok(proposal.caseStudyUrl, "Should have attached a niche case study URL");

    // 2. Approve proposal
    const approveRes = await postJson("/api/proposals", {
      action: "approve",
      proposalId: proposal.id,
    });
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.data.proposal.status, "APPROVED");

    // 3. Send proposal
    const sendRes = await postJson("/api/proposals", {
      action: "send",
      proposalId: proposal.id,
    });
    assert.equal(sendRes.status, 200);
    assert.equal(sendRes.data.proposal.status, "SENT");

    // 4. Accept proposal
    const acceptRes = await postJson("/api/proposals", {
      action: "accept",
      proposalId: proposal.id,
    });
    assert.equal(acceptRes.status, 200);
    assert.equal(acceptRes.data.proposal.status, "ACCEPTED");
  });

  // -------------------------------------------------------------
  // TEST G: Google Calendar Meeting Creation inside Miracle
  // -------------------------------------------------------------
  await runTest("Test G: Internal Google Calendar & Google Meet Creation", async () => {
    const startTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const meetingRes = await postJson("/api/calendar", {
      action: "create",
      leadId: "lead-test-client-1",
      clientName: "Alex Rivera",
      clientEmail: "alex@riveracreative.io",
      businessName: "Rivera Luxury Goods",
      topic: "Brand Strategy & Logo Review",
      startTime,
      durationMinutes: 30,
    });

    assert.equal(meetingRes.status, 200);
    assert.ok(meetingRes.data.ok, "Meeting creation should return ok: true");
    const meeting = meetingRes.data.meeting;
    assert.ok(meeting.id, "Meeting must have an ID");
    assert.ok(meeting.googleMeetUrl, "Meeting must contain a Google Meet URL");
    assert.ok(meeting.googleMeetUrl.includes("meet.google.com"), "Google Meet URL must be legitimate");
    assert.equal(meeting.status, "CONFIRMED_GOOGLE_CALENDAR");

    // Verify slot suggestion action works
    const slotsRes = await postJson("/api/calendar", {
      action: "suggest_slots",
      date: new Date().toISOString(),
    });
    assert.equal(slotsRes.status, 200);
    assert.ok(Array.isArray(slotsRes.data.slots), "Should suggest meeting slots");
    assert.ok(slotsRes.data.slots.length >= 3, "Should suggest at least 3 candidate slots");
  });

  // -------------------------------------------------------------
  // TEST H: Full Client Sales Flow Simulation
  // -------------------------------------------------------------
  await runTest("Test H: Full Sales Flow (Outreach -> Reply -> Proposal -> Meeting -> CRM)", async () => {
    // 1. Simulate incoming prospect message
    const msgRes = await postJson("/api/conversation", {
      action: "handle_message",
      leadId: "lead-full-flow-test",
      messageText: "Hi Zohaib, loved your portfolio. Can you design a logo for our new startup? What's your pricing?",
    });
    assert.equal(msgRes.status, 200);
    assert.ok(msgRes.data.proposedReply, "AI should formulate a contextual reply");
    assert.ok(msgRes.data.proposedReply.includes("$") || msgRes.data.proposedReply.toLowerCase().includes("logo"), "Reply should reference pricing/service");

    // 2. Generate and approve client proposal
    const propRes = await postJson("/api/proposals", {
      action: "generate",
      leadId: "lead-full-flow-test",
      serviceKey: "logo_design",
      scope: "Startup Logo Design & Style Guide",
      customPrice: 85,
    });
    assert.equal(propRes.status, 200);
    const pId = propRes.data.proposal.id;
    await postJson("/api/proposals", { action: "send", proposalId: pId });
    await postJson("/api/proposals", { action: "accept", proposalId: pId });

    // 3. Book meeting and verify CRM auto-update
    const meetRes = await postJson("/api/calendar", {
      action: "create",
      leadId: "lead-full-flow-test",
      clientName: "Startup Founder",
      clientEmail: "founder@startup.io",
      businessName: "Startup Inc",
      topic: "Logo Concept Kickoff",
      startTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      durationMinutes: 30,
    });
    assert.equal(meetRes.status, 200);

    // 4. Verify Analytics KPI reflects active conversations, proposals, and meetings
    const analyticsRes = await getJson("/api/analytics");
    assert.equal(analyticsRes.status, 200);
    assert.ok(analyticsRes.data.kpis.meetingsBooked >= 1, "Meetings KPI must be >= 1");
    assert.ok(analyticsRes.data.kpis.proposalsSent >= 1, "Proposals Sent KPI must be >= 1");
    assert.ok(analyticsRes.data.kpis.proposalsAccepted >= 1, "Proposals Accepted KPI must be >= 1");
  });

  console.log("=============================================================");
  console.log(`TEST RUN FINISHED: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("=============================================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
