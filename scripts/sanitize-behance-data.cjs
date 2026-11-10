const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "apps", "web", ".data");
const vaultFile = path.join(dataDir, "miracle-behance-vault.json");

let realProfileUrl = "https://www.behance.net/zohaibahamd";
if (fs.existsSync(vaultFile)) {
  try {
    const v = JSON.parse(fs.readFileSync(vaultFile, "utf-8"));
    if (v.primary_behance_profile_url) {
      realProfileUrl = v.primary_behance_profile_url;
    }
  } catch {}
}

console.log("Using authoritative real Behance profile URL:", realProfileUrl);

const files = [
  "miracle-leads.json",
  "miracle-proposals.json",
  "miracle-settings.json",
  "miracle-behance-vault.json",
];

for (const file of files) {
  const filePath = path.join(dataDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf-8");
    let changed = false;

    const banned = [
      "https://www.behance.net/miracle-creative-studio",
      "http://www.behance.net/miracle-creative-studio",
      "https://www.behance.net/gallery/luxury-editorial-brand",
      "http://www.behance.net/gallery/luxury-editorial-brand",
      "https://www.behance.net/gallery/viral-retention-showreel",
      "https://www.behance.net/gallery/aesthetic-clinic-collateral",
      "https://www.behance.net/gallery/artisan-bakery-branding",
    ];

    for (const b of banned) {
      if (content.includes(b)) {
        content = content.split(b).join(realProfileUrl);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, "utf-8");
      console.log(`Sanitized: ${file}`);
    } else {
      console.log(`Clean: ${file}`);
    }
  }
}
