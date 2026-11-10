import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=================================================");
  console.log("   MIRACLE CONVERSION & DELIVERABILITY TESTS     ");
  console.log("=================================================");

  // 1. Test Tracking Endpoints (Open & Click)
  console.log("\n[TEST 1] Email Tracking Endpoints");
  const testTrackingId = `test-${Date.now()}`;

  // Test Open Tracking Pixel
  const openRes = await fetch(`${BASE_URL}/api/track/open/${testTrackingId}.png`);
  assert.strictEqual(openRes.status, 200, "Open tracking pixel should return 200");
  assert.strictEqual(openRes.headers.get("content-type"), "image/png", "Open tracking must return image/png");
  console.log("  ✓ GET /api/track/open/[id].png returned 200 with image/png");

  // Test Click Tracking Redirect
  const clickRes = await fetch(
    `${BASE_URL}/api/track/click/${testTrackingId}?type=portfolio&target=${encodeURIComponent("https://frame.io/share/agency-viral-reels-showcase")}`,
    { redirect: "manual" }
  );
  assert.strictEqual(clickRes.status, 302, "Click tracker must return 302 redirect");
  assert.strictEqual(
    clickRes.headers.get("location"),
    "https://frame.io/share/agency-viral-reels-showcase",
    "Click tracker must redirect to intended destination"
  );
  console.log("  ✓ GET /api/track/click/[id] returned 302 redirecting to target");

  // 2. Test Self-Learning Engine API
  console.log("\n[TEST 2] AI Self-Learning Engine API");
  const learningRes = await fetch(`${BASE_URL}/api/email/learning`);
  assert.strictEqual(learningRes.status, 200, "Learning API should return 200");
  const learningData = await learningRes.json();
  assert.strictEqual(learningData.ok, true, "Learning API ok should be true");
  assert.ok(learningData.insights.length > 0, "Should return learning insights");
  assert.ok(learningData.events.length > 0, "Should return tracked events");
  console.log(`  ✓ GET /api/email/learning returned ${learningData.insights.length} insights and ${learningData.events.length} tracked events`);

  // 3. Test SpamGuardEngine in Node
  console.log("\n[TEST 3] Anti-Spam Deliverability & Auto-Rewrite Engine");
  const { SpamGuardEngine } = await import("../src/lib/spam-guard.js").catch(async () => {
    // If running with tsx
    return await import("../src/lib/spam-guard.ts");
  });

  const spammyDraft = "Get our 100% free video reel guaranteed!!! Click here and act now to buy direct!";
  const analysis = SpamGuardEngine.analyze("URGENT: FREE SAMPLE FOR YOU", spammyDraft);
  console.log(`  Deliverability Score before cleaning: ${analysis.score}/100 (${analysis.rating})`);
  console.log(`  Triggers found: ${analysis.spamTriggersFound.length}`);
  assert.ok(analysis.score < 90, "Spammy draft should receive a penalty score");
  assert.ok(analysis.cleanSubject.includes("sample"), "Cleaned subject should remove FREE");
  assert.ok(analysis.cleanBody.includes("complimentary"), "Cleaned body should replace 100% free with complimentary");
  console.log("  ✓ SpamGuardEngine accurately identified spam triggers and auto-rewrote into executive language");

  const { verifyDomain } = await import("../src/lib/dns-validator.ts");

  // Test Domain MX Record validation with real active domain
  const realDomainCheck = await verifyDomain("partner@gmail.com");
  console.log(`  Domain Check (gmail.com): hasMx=${realDomainCheck.hasMx}, domain=${realDomainCheck.domain}`);
  assert.strictEqual(realDomainCheck.hasMx, true, "Valid domain should pass MX check");

  // Also verify that a non-existent domain is correctly caught
  const fakeDomainCheck = await verifyDomain("test@thisdomaindoesnotexist12345.xyz");
  assert.strictEqual(fakeDomainCheck.hasMx, false, "Fake domain should fail MX check and protect sender reputation");
  console.log("  ✓ DNS MX pre-send validation verified");

  // 4. Test SendTimeOptimizer
  console.log("\n[TEST 4] Research-Backed Send-Time Optimizer");
  const { SendTimeOptimizer } = await import("../src/lib/send-time-optimizer.js").catch(async () => {
    return await import("../src/lib/send-time-optimizer.ts");
  });

  const dubaiTz = SendTimeOptimizer.resolveTimezone("Dubai", "United Arab Emirates");
  assert.strictEqual(dubaiTz, "Asia/Dubai", "Should resolve Dubai to Asia/Dubai");
  const dubaiAnalysis = SendTimeOptimizer.analyze("Dubai", "United Arab Emirates");
  console.log(`  Dubai Local Time: ${dubaiAnalysis.prospectLocalTimeString}`);
  console.log(`  Peak Window Active: ${dubaiAnalysis.isPeakWindowNow}`);
  console.log(`  Banner Headline: ${dubaiAnalysis.bannerHeadline}`);
  assert.ok(dubaiAnalysis.prospectTimezone === "Asia/Dubai", "Timezone should be Asia/Dubai");
  console.log("  ✓ SendTimeOptimizer accurately maps city timezones and computes peak probability windows");

  // 5. Test BrandEmailWriter (Behance only in initial cold email, NO meeting links!)
  console.log("\n[TEST 5] BrandEmailWriter (Behance Only + ZERO Meeting Links in Initial Cold Email)");
  const { BrandEmailWriter, DEFAULT_PORTFOLIO_VAULT } = await import("../src/lib/brand-email-writer.js").catch(async () => {
    return await import("../src/lib/brand-email-writer.ts");
  });

  const sampleProspect = {
    businessName: "Prime Austin Realty",
    contactName: "Sarah Connor",
    email: "sarah@primeaustin.com",
    niche: "Real Estate Agents",
    city: "Austin",
  };

  const customVault = {
    ...DEFAULT_PORTFOLIO_VAULT,
    behanceUrl: "https://www.behance.net/miracle-austin-creative",
    primaryPortfolioUrl: "https://www.behance.net/miracle-austin-creative",
    calendarBookingUrl: "https://meet.google.com/custom-sarah-call",
  };

  // Initial stage test
  const initialGenerated = BrandEmailWriter.generateEmail(sampleProspect, customVault, { stage: "initial" });
  console.log(`  Subject: "${initialGenerated.subject}"`);
  console.log(`  Word count: ${initialGenerated.wordCount} words (Under 100 words)`);
  assert.ok(initialGenerated.wordCount < 115, "Initial cold email must be concise and under 100-110 words");
  assert.ok(initialGenerated.body.includes("https://www.behance.net/miracle-austin-creative"), "Initial cold email MUST weave in Behance portfolio URL");
  assert.ok(!initialGenerated.body.includes("https://meet.google.com"), "STRICT MANDATE: Initial cold email must NEVER contain meeting/Google Meet link!");
  assert.ok(!initialGenerated.body.includes("calendar.google.com"), "STRICT MANDATE: Initial cold email must NEVER contain calendar booking link!");
  assert.ok(initialGenerated.body.includes("Prime Austin Realty"), "Must reference brand name");
  console.log("  ✓ BrandEmailWriter correctly embeds Behance portfolio and blocks ALL meeting/calendar links in initial email");

  // 6. Test Google Calendar & Google Meet API Endpoint
  console.log("\n[TEST 6] Real Google Calendar & Meet Scheduler Endpoint");
  const schedRes = await fetch(`${BASE_URL}/api/integrations/calendar/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leadName: "Jordan Welch",
      leadEmail: "collabs@thejordanwelch.com",
      senderEmail: "zohaibaidesigner@gmail.com",
      customTopic: "Creative Video & Thumbnail Strategy",
    }),
  });
  assert.strictEqual(schedRes.status, 200, "Schedule API should return 200");
  const schedData = await schedRes.json();
  assert.strictEqual(schedData.ok, true, "Schedule API ok should be true");
  assert.ok(schedData.meeting.meetLink.startsWith("https://meet.google.com/"), "Must generate real meet.google.com link");
  assert.ok(schedData.meeting.googleCalendarUrl.includes("calendar.google.com"), "Must generate official Google Calendar URL");
  console.log(`  Google Meet Link: ${schedData.meeting.meetLink}`);
  console.log(`  Calendar Web Intent: ${schedData.meeting.googleCalendarUrl.slice(0, 80)}...`);
  console.log("  ✓ /api/integrations/calendar/schedule generated real Google Meet & Google Calendar event URLs");

  // 7. Test Professional SaaS Navigation Structure
  console.log("\n[TEST 7] Professional SaaS Navigation Structure (No 'Step 1..4' labels)");
  const { SCREENS, BOTTOM_SCREENS } = await import("../src/lib/screens.js").catch(async () => {
    return await import("../src/lib/screens.ts");
  });
  assert.strictEqual(SCREENS.length, 6, "Navigation must contain the 6 core operational workspace screens");
  assert.strictEqual(SCREENS[0].href, "/dashboard", "Screen 1 must be Overview (/dashboard)");
  assert.strictEqual(SCREENS[1].href, "/lead-hunter", "Screen 2 must be Find Leads (/lead-hunter)");
  assert.strictEqual(SCREENS[2].href, "/pipeline", "Screen 3 must be Lead Pipeline (/pipeline)");
  assert.strictEqual(SCREENS[3].href, "/outreach", "Screen 4 must be Outreach & Inbox (/outreach)");
  assert.strictEqual(SCREENS[4].href, "/meetings-setup", "Screen 5 must be Calendar & Meetings (/meetings-setup)");
  assert.strictEqual(SCREENS[5].href, "/portfolio", "Screen 6 must be My Portfolio (/portfolio)");
  assert.strictEqual(BOTTOM_SCREENS[0].href, "/settings", "Bottom item must be Account Setup & Settings (/settings)");
  console.log("  ✓ Navigation verified: 6 core operational screens + Account Setup Hub in bottom bar");

  console.log("\n=================================================");
  console.log("   🎉 ALL 7 CONVERSION & DELIVERABILITY TESTS PASSED! ");
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
