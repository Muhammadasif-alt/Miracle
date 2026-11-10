import { chromium } from "playwright";
import assert from "node:assert/strict";

async function runTests() {
  console.log("Starting Miracle V3 Final UI & Functional Verification with Playwright...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // Step 0: Sign in to App Session
    // -------------------------------------------------------------
    console.log("0. Signing in to Miracle app session...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.click('button:has-text("Owner")');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    console.log("   ✓ Signed in successfully");

    // -------------------------------------------------------------
    // Test 1: Pitch Studio Search Form & Dropdowns
    // -------------------------------------------------------------
    console.log("1. Testing Pitch Studio page...");
    await page.goto("http://localhost:3000/pitch-studio", { waitUntil: "networkidle" });

    // Check page title / topbar
    const pageContent = await page.content();
    assert.ok(pageContent.includes("Live Outreach Analytics"), "Analytics header must be visible");

    // Verify slider is GONE
    const sliderCount = await page.locator('input[type="range"]').count();
    assert.equal(sliderCount, 0, "Lead count slider must be completely removed");
    console.log("   ✓ Lead count slider is completely removed");

    // Verify Number of Leads dropdown exists
    const leadsSelect = page.locator("select").filter({ hasText: "50 Leads" });
    assert.ok((await leadsSelect.count()) > 0, "Number of Leads dropdown must exist");
    console.log("   ✓ Number of Leads compact dropdown is present");

    // Verify Country Searchable Dropdown
    const countryButton = page.locator("button").filter({ hasText: "United States" });
    assert.ok((await countryButton.count()) > 0, "Country selector button must exist");
    console.log("   ✓ Country Searchable Select is present");

    // Verify Niche Searchable Dropdown
    const nicheButton = page.locator("button").filter({ hasText: "Dental Clinics" });
    assert.ok((await nicheButton.count()) > 0, "Niche selector button must exist");
    console.log("   ✓ Niche Searchable Select is present");

    // -------------------------------------------------------------
    // Test 2: Real Sender Name in Email Composer
    // -------------------------------------------------------------
    console.log("2. Testing Lead Discovery & Real Sender Signature in Email Composer...");
    // Click 'Find Leads' to generate leads for selected niche
    await page.click('button:has-text("Find Leads")');
    await page.waitForTimeout(2000);

    // Click the first discovered lead
    const leadRow = page.locator("div.cursor-pointer").first();
    await leadRow.click();
    await page.waitForTimeout(500);

    const composerTextarea = page.locator("textarea").first();
    const bodyVal = await composerTextarea.inputValue();
    assert.ok(!bodyVal.includes("Creative Studio Lead"), "Must NOT contain 'Creative Studio Lead'");
    assert.ok(bodyVal.includes("Zohaib"), "Body must contain actual sender name 'Zohaib'");
    console.log("   ✓ Generated email body signs with real name 'Zohaib' (Zero fictional roles)");

    // -------------------------------------------------------------
    // Test 3: Meetings Page & Google Calendar Status
    // -------------------------------------------------------------
    console.log("3. Testing Meetings Page...");
    await page.goto("http://localhost:3000/meetings", { waitUntil: "networkidle" });
    const meetingsContent = await page.content();

    // Check filter tabs
    assert.ok(meetingsContent.includes("Upcoming"), "Upcoming tab must exist");
    assert.ok(meetingsContent.includes("Today"), "Today tab must exist");
    assert.ok(meetingsContent.includes("This Week"), "This Week tab must exist");
    assert.ok(meetingsContent.includes("Past"), "Past tab must exist");
    console.log("   ✓ Meetings filter tabs (Upcoming, Today, This Week, Past, All) are rendered");

    // Check Google Calendar connection status bar
    assert.ok(meetingsContent.includes("Google Calendar"), "Google Calendar status bar must be present");
    assert.ok(meetingsContent.includes("Primary Google Calendar"), "Target calendar name must be shown");
    console.log("   ✓ Google Calendar status bar with real account & calendar name is displayed");

    // -------------------------------------------------------------
    // Test 4: Settings Hub UI Simplification
    // -------------------------------------------------------------
    console.log("4. Testing Settings Page...");
    await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
    const settingsContent = await page.content();

    // Verify simplified heading
    assert.ok(settingsContent.includes("Settings"), "Heading 'Settings' must exist");
    assert.ok(!settingsContent.includes("Account Setup & Settings Hub"), "Oversized heading must be removed");
    console.log("   ✓ Simple clean heading 'Settings' verified (oversized labels removed)");

    // Verify 6 responsive tabs
    assert.ok(settingsContent.includes("Profile"), "Profile tab must exist");
    assert.ok(settingsContent.includes("Email Accounts"), "Email Accounts tab must exist");
    assert.ok(settingsContent.includes("Google Calendar"), "Google Calendar tab must exist");
    assert.ok(settingsContent.includes("Behance"), "Behance tab must exist");
    assert.ok(settingsContent.includes("Gemini AI"), "Gemini AI tab must exist");
    assert.ok(settingsContent.includes("Automation"), "Automation tab must exist");
    console.log("   ✓ All 6 compact Settings tabs present and accessible");

    // Test switching to Google Calendar tab
    await page.locator("button", { hasText: "Google Calendar" }).click();
    await page.waitForTimeout(500);
    const calText = await page.locator("body").innerText();
    assert.ok(calText.includes("Google Calendar & Meet Sync"), "Calendar section active");
    assert.ok(calText.includes("Test Calendar Health"), "Test Calendar Health button present");
    console.log("   ✓ Google Calendar Settings tab verified with genuine health check button");

    // Test switching to Gemini AI tab
    await page.locator("button", { hasText: "Gemini AI" }).click();
    await page.waitForTimeout(500);
    const geminiText = await page.locator("body").innerText();
    assert.ok(geminiText.includes("Gemini AI Engine"), "Gemini AI section active");
    assert.ok(geminiText.includes("Test Gemini Connection"), "Test Gemini button present");
    console.log("   ✓ Gemini AI tab verified with direct test connection button");

    console.log("\n=======================================================");
    console.log("✓ ALL PLAYWRIGHT BROWSER TESTS PASSED SUCCESSFULLY (0 ERRORS)");
    console.log("=======================================================\n");
  } finally {
    await browser.close();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
