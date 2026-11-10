const assert = require("node:assert/strict");
const path = require("node:path");

// Point to built ts / run with ts-node or load behance-vault directly
const { BehanceVault } = require("../apps/web/src/lib/behance-vault");
const { BrandEmailWriter } = require("../apps/web/src/lib/brand-email-writer");

async function runTests() {
  console.log("=== BEHANCE PERMANENT BUG FIX AUDIT ===");

  // 1. One Source of Truth Check
  const vault = BehanceVault.getVault();
  console.log("1. Vault Primary Profile:", vault.primary_behance_profile_url);
  assert.equal(vault.primary_behance_profile_url, "https://www.behance.net/zohaibahamd");

  // 2. Catalyst Gyms Associates Test (The exact bug scenario)
  console.log("\n2. Testing Catalyst Gyms Associates Pitch Generation...");
  const catalystProof = BehanceVault.resolvePortfolioProof("Gyms & Fitness Centers");
  console.log("Catalyst Proof Resolution:", catalystProof);
  assert.equal(catalystProof.url, "https://www.behance.net/zohaibahamd");
  assert.ok(!catalystProof.proofText.includes("luxury-editorial-brand"));
  assert.ok(catalystProof.proofText.includes("https://www.behance.net/zohaibahamd"));

  const email = BrandEmailWriter.generateEmail(
    {
      businessName: "Catalyst Gyms Associates",
      email: "contact@catalystgyms.com",
      niche: "Gyms & Fitness Centers",
      city: "Chicago",
      country: "US",
    },
    {
      primaryPortfolioUrl: vault.primary_behance_profile_url,
      behanceUrl: vault.primary_behance_profile_url,
      servicesOffered: "Graphic Design & Brand Assets",
      senderName: "Zohaib",
      businessName: "Miracle Creative Studio",
    }
  );
  console.log("Generated Pitch Body Preview:\n", email.body);
  assert.ok(!email.body.includes("luxury-editorial-brand"), "FAILED: Contains banned URL");
  assert.ok(email.body.includes("https://www.behance.net/zohaibahamd"), "FAILED: Missing authentic profile URL");

  // 3. Test 10 Diverse Niches
  console.log("\n3. Testing 10 Diverse Niches Resolution...");
  const niches = [
    "Real Estate Agents",
    "Gyms & Fitness Centers",
    "Dental & Orthodontics",
    "YouTubers & Creators",
    "B2B SaaS",
    "Corporate Law Firms",
    "Artisan Bakeries",
    "Commercial Plumbing",
    "Roofing Contractors",
    "Accounting & Tax Advisory",
  ];

  for (const n of niches) {
    const proof = BehanceVault.resolvePortfolioProof(n);
    assert.ok(proof.url === "https://www.behance.net/zohaibahamd" || BehanceVault.isAuthorizedPortfolioUrl(proof.url));
    assert.ok(!proof.proofText.includes("luxury-editorial-brand"));
    assert.ok(!proof.proofText.includes("viral-retention-showreel"));
    console.log(`  [PASS] Niche: "${n}" -> ${proof.url}`);
  }

  // 4. Pre-Send Validation Guard Test
  console.log("\n4. Testing Pre-Send Validation Guard...");
  const maliciousEmail1 = "Here is my work: https://www.behance.net/gallery/luxury-editorial-brand";
  const validation1 = BehanceVault.validateDraftUrls(maliciousEmail1);
  assert.equal(validation1.valid, false, "Guard must reject banned URL");
  console.log("  [PASS] Blocked unauthorized URL:", validation1.unauthorizedUrls);

  const maliciousEmail2 = "Check this fake project: https://www.behance.net/gallery/some-random-stolen-project-123";
  const validation2 = BehanceVault.validateDraftUrls(maliciousEmail2);
  assert.equal(validation2.valid, false, "Guard must reject unapproved project URL");
  console.log("  [PASS] Blocked unapproved project URL:", validation2.unauthorizedUrls);

  const legitEmail = `Check out my creative work at ${vault.primary_behance_profile_url}`;
  const validation3 = BehanceVault.validateDraftUrls(legitEmail);
  assert.equal(validation3.valid, true, "Guard must accept authentic saved user profile");
  console.log("  [PASS] Allowed authentic user profile:", legitEmail);

  console.log("\n ALL BEHANCE FIX AUDIT TESTS PASSED!");
}

runTests().catch((e) => {
  console.error("Test Error:", e);
  process.exit(1);
});
