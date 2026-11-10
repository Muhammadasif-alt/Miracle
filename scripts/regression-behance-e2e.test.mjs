import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const VAULT_FILE = path.join(ROOT, "apps", "web", ".data", "miracle-behance-vault.json");
const SETTINGS_FILE = path.join(ROOT, "apps", "web", ".data", "miracle-settings.json");
const BASE_URL = "http://localhost:3000";

const USER_REAL_URL = "https://www.behance.net/zohaibahamd";
const BANNED_PRACTICE_URL = "https://www.behance.net/miracle-creative-studio";
const BANNED_GALLERY_URL = "https://www.behance.net/gallery/luxury-editorial-brand";

async function main() {
  console.log("===============================================================");
  console.log("   MIRACLE E2E REGRESSION TEST: BEHANCE ONE SOURCE OF TRUTH   ");
  console.log("===============================================================\n");

  // TEST 1: SAVE USER'S AUTHENTIC BEHANCE PROFILE VIA API
  console.log("TEST 1: Saving user's authentic profile URL via API...");
  const saveRes = await fetch(`${BASE_URL}/api/settings/behance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update_profile",
      profileUrl: USER_REAL_URL,
      forceUnlock: true,
    }),
  });
  const saveJson = await saveRes.json();
  assert.equal(saveRes.status, 200, `Save API failed: ${JSON.stringify(saveJson)}`);
  assert.equal(saveJson.ok, true);
  assert.equal(saveJson.profileUrl, USER_REAL_URL, "Returned profileUrl must match saved URL");
  console.log("  [PASS] Save API persisted URL:", saveJson.profileUrl);

  // TEST 2: DATABASE PERSISTENCE VERIFICATION (Direct Disk Read)
  console.log("\nTEST 2: Verifying database file on disk directly...");
  assert.ok(fs.existsSync(VAULT_FILE), "Vault file must exist on disk");
  const vaultOnDisk = JSON.parse(fs.readFileSync(VAULT_FILE, "utf-8"));
  assert.equal(vaultOnDisk.primary_behance_profile_url, USER_REAL_URL, "Disk database must contain user's exact URL");
  console.log("  [PASS] Disk database confirmed value:", vaultOnDisk.primary_behance_profile_url);

  // TEST 3: SETTINGS READ API (Full App State)
  console.log("\nTEST 3: Verifying Settings GET API returns database value...");
  const settingsRes = await fetch(`${BASE_URL}/api/settings`);
  const settingsJson = await settingsRes.json();
  assert.equal(settingsRes.status, 200);
  assert.equal(settingsJson.settings.behance.primary_behance_profile_url, USER_REAL_URL);
  assert.equal(settingsJson.settings.behance.profileUrl, USER_REAL_URL);
  assert.ok(!JSON.stringify(settingsJson).includes(BANNED_PRACTICE_URL), "Settings must NOT contain miracle-creative-studio");
  console.log("  [PASS] Settings API confirmed value:", settingsJson.settings.behance.primary_behance_profile_url);

  // TEST 4: PITCH GENERATOR FOR CATALYST GYMS ASSOCIATES
  console.log("\nTEST 4: Pitch generation for Catalyst Gyms Associates...");
  const geminiRes = await fetch(`${BASE_URL}/api/ai/gemini`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "generate",
      lead: {
        businessName: "Catalyst Gyms Associates",
        niche: "Gyms & Fitness Centers",
        city: "Chicago",
        country: "US",
      },
      service: "High-Converting Video & Brand Assets",
    }),
  });
  const geminiJson = await geminiRes.json();
  assert.equal(geminiRes.status, 200);
  assert.ok(geminiJson.ok);
  assert.ok(geminiJson.pitch.body.includes(USER_REAL_URL), "Pitch body must contain exact user Behance URL");
  assert.ok(!geminiJson.pitch.body.includes(BANNED_PRACTICE_URL), "Pitch body must NOT contain miracle-creative-studio");
  assert.ok(!geminiJson.pitch.body.includes(BANNED_GALLERY_URL), "Pitch body must NOT contain luxury-editorial-brand");
  console.log("  [PASS] Catalyst Gyms Pitch generated with exact profile URL:");
  console.log("  --- Pitch Body Preview ---");
  console.log(geminiJson.pitch.body.split("\n").slice(0, 7).join("\n"));
  console.log("  --------------------------");

  // TEST 5: TEST 10 DIVERSE LEADS IN PARALLEL
  console.log("\nTEST 5: Generating pitches for 10 diverse business niches...");
  const niches = [
    { name: "Apex Dental Care", niche: "Dental & Orthodontics" },
    { name: "Skyline Luxury Realty", niche: "Real Estate Agents" },
    { name: "Creator Forge Media", niche: "YouTubers & Creators" },
    { name: "Vanguard SaaS Labs", niche: "B2B SaaS" },
    { name: "Metro Legal Defense", niche: "Corporate Law" },
    { name: "Artisan Sourdough Co", niche: "Artisan Bakeries" },
    { name: "Paramount Plumbing Pros", niche: "Commercial Plumbing" },
    { name: "Zenith Roofing Solutions", niche: "Roofing Contractors" },
    { name: "Summit Tax Advisory", niche: "Accounting & Tax" },
    { name: "Horizon Logistics", niche: "Freight & Transport" },
  ];

  for (const item of niches) {
    const res = await fetch(`${BASE_URL}/api/ai/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate",
        lead: { businessName: item.name, niche: item.niche },
      }),
    });
    const json = await res.json();
    assert.ok(json.ok);
    assert.ok(json.pitch.body.includes(USER_REAL_URL), `Failed for ${item.name}: URL not in body`);
    assert.ok(!json.pitch.body.includes(BANNED_PRACTICE_URL), `Failed for ${item.name}: contains banned URL`);
    console.log(`  [PASS] ${item.name} (${item.niche}) -> ${USER_REAL_URL}`);
  }

  // TEST 6: BANNED PLACEHOLDERS ARE BLOCKED BY BACKEND VALIDATION
  console.log("\nTEST 6: Verifying banned placeholders are REJECTED if submitted...");
  const tryBannedRes = await fetch(`${BASE_URL}/api/settings/behance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update_profile",
      profileUrl: BANNED_PRACTICE_URL,
      forceUnlock: true,
    }),
  });
  const tryBannedJson = await tryBannedRes.json();
  assert.equal(tryBannedRes.status, 400, "Must return 400 Bad Request for banned placeholder");
  assert.equal(tryBannedJson.ok, false);
  console.log("  [PASS] Successfully blocked submission of miracle-creative-studio:", tryBannedJson.error);

  // TEST 7: OUTBOUND DISPATCH VALIDATION GUARD
  console.log("\nTEST 7: Testing Outbound Dispatch Pre-Send Validation Guard...");
  const fakeSendRes = await fetch(`${BASE_URL}/api/integrations/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: "prospect@example.com",
      subject: "Test Pitch",
      content: `Hi there, check my work: ${BANNED_PRACTICE_URL}`,
    }),
  });
  const fakeSendJson = await fakeSendRes.json();
  assert.equal(fakeSendRes.status, 400, "Send endpoint must block banned portfolio URLs");
  assert.equal(fakeSendJson.code, "UNAUTHORIZED_PORTFOLIO_URL");
  console.log("  [PASS] Outbound send blocked fake URL:", fakeSendJson.unauthorizedUrls);

  // TEST 8: PERSISTENCE ACROSS RE-READS
  console.log("\nTEST 8: Final Persistence Verification...");
  const finalCheck = JSON.parse(fs.readFileSync(VAULT_FILE, "utf-8"));
  assert.equal(finalCheck.primary_behance_profile_url, USER_REAL_URL);
  console.log("  [PASS] Database primary_behance_profile_url remains locked at:", finalCheck.primary_behance_profile_url);

  console.log("\n===============================================================");
  console.log("   ALL 8 REGRESSION AUDIT CRITERIA PASSED WITHOUT COMPROMISE!  ");
  console.log("===============================================================");
}

main().catch((err) => {
  console.error("\n❌ REGRESSION TEST FAILED:", err);
  process.exit(1);
});
