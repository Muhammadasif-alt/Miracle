const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "apps", "web", ".data");
const leadsFile = path.join(dataDir, "miracle-leads.json");
const suppressionFile = path.join(dataDir, "miracle-suppression-registry.json");

const leads = JSON.parse(fs.readFileSync(leadsFile, "utf-8"));
const suppression = JSON.parse(fs.readFileSync(suppressionFile, "utf-8"));

const failedDomains = [
  "catalystgymsassociates.com",
  "horizongymshouse.com",
  "sterlinggymsclinic.com",
  "paramountgymspartners.com",
  "ascentgymsstudio.com",
  "ascentgymstudio.com"
];

const audited = leads.filter(l => {
  const email = (l.contactEmail || l.email || "").toLowerCase();
  return failedDomains.some(d => email.includes(d));
});

console.log("Found matches in leads:", audited.length);
for (const l of audited) {
  const email = (l.contactEmail || l.email || "").toLowerCase();
  const supp = suppression.find(s => s.normalizedEmail === email);
  console.log({
    id: l.id,
    businessName: l.businessName || l.companyName,
    website: l.website,
    email: email,
    source: l.source,
    emailStatus: l.emailStatus,
    crmStatus: l.crmStatus,
    outreachStatus: l.outreachStatus,
    suppressionReason: supp?.reason || "NONE",
    suppressionNotes: supp?.notes || "",
    suppressedAt: supp?.suppressedAt || ""
  });
}
