import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "apps", "web", ".data");

async function runTests() {
  console.log("=== Testing Lead Deliverability & Contact Quality Engine ===");

  const BASE_URL = "http://localhost:3000";

  // 1. Fetch existing lead from API
  console.log("\n[Setup] Fetching active lead from CRM API...");
  const leadsRes = await fetch(`${BASE_URL}/api/leads`);
  const leadsData = await leadsRes.json();
  assert(leadsData.ok, "Leads API must return ok: true");
  assert(leadsData.leads.length > 0, "Must have leads in CRM");

  const targetLead = leadsData.leads[0];
  console.log(`Using Lead: ${targetLead.businessName} (ID: ${targetLead.id}, Email: ${targetLead.email})`);

  // 2. Test Manual Email Attachment with Real Valid Domain & MX (equinox.com)
  console.log("\n[Test 1] Testing Manual Email Attachment with Valid MX Domain (equinox.com)...");
  const attachValidRes = await fetch(`${BASE_URL}/api/leads/contact-actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "attach_manual_email",
      leadId: targetLead.id,
      email: "concierge@equinox.com",
    }),
  });

  const attachValidData = await attachValidRes.json();
  console.log("Attach Valid Email Response:", attachValidData);
  assert.equal(attachValidData.ok, true, "Must attach verified email successfully");
  assert.equal(attachValidData.lead.email, "concierge@equinox.com");
  assert.equal(attachValidData.lead.verificationStatus, "VERIFIED");
  console.log("✓ Test 1 Passed: Valid domain with MX verified and attached to lead record.");

  // 3. Test Manual Email Attachment on Non-existent Domain (should fail MX check)
  console.log("\n[Test 2] Testing Manual Email Attachment on Non-existent Domain (fake-nx-domain.com)...");
  const attachFakeRes = await fetch(`${BASE_URL}/api/leads/contact-actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "attach_manual_email",
      leadId: targetLead.id,
      email: "inquiries@fake-nx-domain-12345.com",
    }),
  });

  const attachFakeData = await attachFakeRes.json();
  console.log("Attach Fake Email Response:", attachFakeData);
  assert.equal(attachFakeData.ok, false, "Must reject email with non-existent MX");
  assert(attachFakeData.error.toLowerCase().includes("deliverability"), "Error message must explain deliverability failure");
  console.log("✓ Test 2 Passed: Deliverability pre-check blocked invalid domain from CRM attachment.");

  // 4. Test Pre-Send Guard Does NOT Corrupt Suppression Registry
  console.log("\n[Test 3] Testing Email Send Pre-Check Guard...");
  const registryFile = path.join(dataDir, "miracle-suppression-registry.json");
  const registryBefore = JSON.parse(fs.readFileSync(registryFile, "utf-8"));
  const getCount = (reg) => Array.isArray(reg) ? reg.length : (reg.suppressedEmails?.length || 0);
  const initialSuppressedCount = getCount(registryBefore);

  const sendAttemptRes = await fetch(`${BASE_URL}/api/integrations/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: "info@paramountgymspartners.com",
      subject: "Partnership Inquiry",
      content: "Hello from Zohaib",
      leadId: targetLead.id,
    }),
  });

  const sendAttemptData = await sendAttemptRes.json();
  console.log("Send Pre-check Block Response:", sendAttemptData);
  assert.equal(sendAttemptRes.status, 422, "Must return HTTP 422 Unprocessable Entity");
  assert.equal(sendAttemptData.code, "DELIVERABILITY_PRECHECK_FAILED");

  const registryAfter = JSON.parse(fs.readFileSync(registryFile, "utf-8"));
  assert.equal(
    getCount(registryAfter),
    initialSuppressedCount,
    "Suppression registry count MUST NOT increase on pre-check failure! False HARD_BOUNCE must not be written."
  );
  console.log("✓ Test 3 Passed: Pre-check safely rejected sending and did NOT corrupt suppression registry.");

  // 5. Test Discovery Replacement Engine with Target 4 Leads
  console.log("\n[Test 4] Testing Lead Discovery API with 4 Targeted Verified Leads...");
  const startJobRes = await fetch(`${BASE_URL}/api/discovery/job`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      niche: "Fitness & Wellness",
      country: "United States",
      city: "Chicago",
      targetCount: 4,
      action: "start",
    }),
  });

  const startJobData = await startJobRes.json();
  console.log("Discovery Job Response:", startJobData);
  assert.equal(startJobData.ok, true, "Discovery job must start successfully");
  assert.equal(startJobData.job.requestedValidLeads, 4, "Requested valid leads must be 4");
  assert.equal(startJobData.job.readyContacts, 4, "Must reach exactly 4 verified ready contacts");
  assert.equal(startJobData.job.completionReason, "TARGET_REACHED");
  console.log("Discovery Metrics:", startJobData.job.metrics);
  console.log("✓ Test 4 Passed: Discovery engine executed replacement loop and delivered verified contacts.");

  console.log("\n=======================================================");
  console.log("ALL TESTS PASSED! Lead Discovery & Quality Engine 100% OPERATIONAL.");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
