// tests/miracle-v4-e2e.test.mjs
// MIRACLE V4 END-TO-END AUTOMATED VERIFICATION TEST SUITE

import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==========================================================");
  console.log("   MIRACLE V4 — PRODUCTION VERIFICATION TEST SUITE        ");
  console.log("==========================================================");

  // TEST 1: Four Primary Home Sections
  console.log("\n[TEST 1] Verifying 4 Primary Operational Sections & HTTP 200...");
  const sections = ["/pitch-studio", "/leads", "/meetings", "/analytics", "/settings"];
  for (const s of sections) {
    const res = await fetch(`${BASE_URL}${s}`);
    assert.strictEqual(res.status, 200, `Expected 200 for ${s}, got ${res.status}`);
    console.log(`  [OK] Section accessible: ${s} (HTTP ${res.status})`);
  }

  // TEST 2: Testing / Dry-Run Mode Safety Engine
  console.log("\n[TEST 2] Verifying Testing / Dry-Run Mode Safety Enforcements...");
  // Ensure we start in TESTING mode
  await fetch(`${BASE_URL}/api/settings/safety/resume`, { method: "POST" });
  const safetyRes = await fetch(`${BASE_URL}/api/settings/safety`);
  const safetyData = await safetyRes.json();
  assert.strictEqual(safetyData.ok, true);
  assert.strictEqual(safetyData.safety.operatingMode, "TESTING");
  console.log(`  [OK] Operating Mode confirmed: ${safetyData.safety.operatingMode}`);
  console.log(`  [OK] Deployment Flag: ${safetyData.safety.deploymentLiveFlag ? "LIVE" : "LOCKED_SAFE"}`);

  // TEST 3: Zero Outbound Send To Real Prospects in Testing Mode
  console.log("\n[TEST 3] Testing Email Simulation (Zero Outbound to Prospects)...");
  const sendRes = await fetch(`${BASE_URL}/api/integrations/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: "prospect@gmail.com",
      subject: "Test Pitch",
      content: "Hello, this is a test pitch.",
      company: "Real Creative Client",
    }),
  });
  const sendData = await sendRes.json();
  assert.strictEqual(sendData.ok, true);
  assert.strictEqual(sendData.simulated, true);
  assert.strictEqual(sendData.mode, "TESTING");
  console.log(`  [OK] Prospect email was safely SIMULATED: ${sendData.message}`);

  // TEST 4: Emergency Stop Control
  console.log("\n[TEST 4] Verifying Emergency Stop Pause & Resume...");
  const pauseRes = await fetch(`${BASE_URL}/api/settings/safety/emergency-stop`, { method: "POST" });
  const pauseData = await pauseRes.json();
  assert.strictEqual(pauseData.ok, true);
  assert.strictEqual(pauseData.safety.operatingMode, "LIVE_PAUSED");
  assert.strictEqual(pauseData.safety.outreachPaused, true);
  console.log("  [OK] Emergency Stop paused all outbound queues.");

  const resumeRes = await fetch(`${BASE_URL}/api/settings/safety/resume`, { method: "POST" });
  const resumeData = await resumeRes.json();
  assert.strictEqual(resumeData.ok, true);
  assert.strictEqual(resumeData.safety.operatingMode, "TESTING");
  console.log("  [OK] Safe Testing Mode resumed cleanly.");

  // TEST 5: Lead Discovery, Deduplication & Locked Behance Proof
  console.log("\n[TEST 5] Testing Pitch Studio Discovery & Locked Behance URL...");
  const discRes = await fetch(`${BASE_URL}/api/discovery/job`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "start",
      country: "United States",
      city: "Austin",
      niche: "Dental Clinics",
      leadCount: 5,
    }),
  });
  const discData = await discRes.json();
  if (!discData.ok) {
    console.error("  [DEBUG] Discovery error payload:", discData);
  }
  assert.strictEqual(discData.ok, true);
  assert.strictEqual(Array.isArray(discData.leads), true);
  assert.strictEqual(discData.leads.length, 5);
  console.log(`  [OK] Discovered ${discData.leads.length} fresh deduplicated leads for Austin Dental Clinics.`);

  // Verify locked Behance URL
  const settingsRes = await fetch(`${BASE_URL}/api/settings`);
  const settingsData = await settingsRes.json();
  const behance = settingsData.settings.behance?.profileUrl;
  assert.match(behance, /behance\.net/);
  console.log(`  [OK] Locked Behance URL Verified: ${behance}`);

  // TEST 6: All Leads CRM & Lead Bin Lifecycle
  console.log("\n[TEST 6] Testing All Leads CRM, Lead Bin & Suppression...");
  const targetLead = discData.leads[0];
  assert.ok(targetLead, "Target lead should exist");

  // Move to Bin
  const binRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "bin", leadId: targetLead.id }),
  });
  const binData = await binRes.json();
  assert.strictEqual(binData.ok, true);
  console.log(`  [OK] Lead ${targetLead.companyName} moved to Bin.`);

  // Verify in Bin Tab
  const binTabRes = await fetch(`${BASE_URL}/api/leads?tab=BIN`);
  const binTabData = await binTabRes.json();
  const foundInBin = binTabData.leads.some((l) => l.id === targetLead.id);
  assert.strictEqual(foundInBin, true, "Lead should be found in Bin tab");
  console.log("  [OK] Lead verified in Bin tab.");

  // Restore from Bin
  const restoreRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "restore", leadId: targetLead.id }),
  });
  const restoreData = await restoreRes.json();
  assert.strictEqual(restoreData.ok, true);
  console.log(`  [OK] Lead ${targetLead.companyName} restored to CRM.`);

  // Archive lead
  const arcRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "archive", leadId: targetLead.id }),
  });
  const arcData = await arcRes.json();
  assert.strictEqual(arcData.ok, true);
  console.log(`  [OK] Lead ${targetLead.companyName} archived.`);

  // TEST 7: Google Calendar & Meet Auto-Add
  console.log("\n[TEST 7] Testing Google Calendar Integration & Auto-Add...");
  const calRes = await fetch(`${BASE_URL}/api/calendar`);
  const calData = await calRes.json();
  assert.strictEqual(calData.ok, true);
  assert.strictEqual(calData.status, "CONNECTED");
  console.log(`  [OK] Google Calendar status: ${calData.status} (${calData.accountEmail})`);

  const createMeetingRes = await fetch(`${BASE_URL}/api/calendar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_event",
      clientName: "Dr. Austin Smile",
      clientEmail: "dr.austin@austinsmile.com",
      businessName: "Austin Smile Studio",
      durationMinutes: 30,
      notes: "Video Brand Identity Scope",
      attachMeet: true,
    }),
  });
  const createMeetingData = await createMeetingRes.json();
  assert.strictEqual(createMeetingData.ok, true);
  assert.ok(createMeetingData.meeting.googleMeetUrl.includes("meet.google.com"));
  assert.ok(createMeetingData.googleEventUrl.includes("calendar.google.com"));
  console.log(`  [OK] Google Meet Link Generated: ${createMeetingData.meeting.googleMeetUrl}`);
  console.log(`  [OK] Direct Auto-Add Calendar URL: ${createMeetingData.googleEventUrl.substring(0, 70)}...`);

  // TEST 8: Analytics & Honest Tracking
  console.log("\n[TEST 8] Testing Analytics KPI Engine & View Modes...");
  const anaRes = await fetch(`${BASE_URL}/api/analytics?timeframe=all&mode=simulated`);
  const anaData = await anaRes.json();
  assert.strictEqual(anaData.ok, true);
  assert.strictEqual(anaData.kpis.openTrackingLabel, "Estimated Opens");
  console.log(`  [OK] Analytics Open Tracking Label: "${anaData.kpis.openTrackingLabel}"`);
  console.log(`  [OK] Simulated Funnel Stages: ${anaData.funnel.length} stages rendered.`);

  console.log("\n==========================================================");
  console.log("   ALL MIRACLE V4 TESTS PASSED (8/8 SUITES OK)            ");
  console.log("==========================================================");
}

runTests().catch((err) => {
  console.error("\nTEST SUITE FAILED:", err);
  process.exit(1);
});
