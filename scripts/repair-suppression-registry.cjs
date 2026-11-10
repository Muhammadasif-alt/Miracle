const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "apps", "web", ".data");
const leadsFile = path.join(dataDir, "miracle-leads.json");
const suppFile = path.join(dataDir, "miracle-suppression-registry.json");

const suppression = JSON.parse(fs.readFileSync(suppFile, "utf-8"));
const leads = JSON.parse(fs.readFileSync(leadsFile, "utf-8"));

console.log("Original suppression records:", suppression.length);

const cleanedSuppression = [];
const correctedEmails = [];

for (const s of suppression) {
  // If reason is HARD_BOUNCE but notes indicate DNS pre-check failure, remove from suppression registry
  if (s.reason === "HARD_BOUNCE" && s.notes && s.notes.includes("prevented hard bounce")) {
    console.log(`Removing false pre-check bounce from suppression registry: ${s.normalizedEmail}`);
    correctedEmails.push(s.normalizedEmail);
  } else {
    cleanedSuppression.push(s);
  }
}

fs.writeFileSync(suppFile, JSON.stringify(cleanedSuppression, null, 2), "utf-8");
console.log("Cleaned suppression records:", cleanedSuppression.length);

// Update corresponding leads in miracle-leads.json
let updatedLeadsCount = 0;
for (const lead of leads) {
  const email = (lead.contactEmail || lead.email || "").toLowerCase().trim();
  if (correctedEmails.includes(email)) {
    lead.emailStatus = "INVALID_DOMAIN";
    lead.verificationStatus = "INVALID_DOMAIN";
    lead.outreachStatus = "Invalid Domain - Needs Research";
    lead.auditFindings = `${lead.auditFindings || ""} [Deliverability Note: Domain has no active MX records in public DNS]`.trim();
    updatedLeadsCount++;
  }
}

fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2), "utf-8");
console.log(`Updated ${updatedLeadsCount} leads with corrected deliverability status.`);
