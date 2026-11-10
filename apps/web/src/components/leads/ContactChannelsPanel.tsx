"use client";

import { useState } from "react";
import { AtSign, Briefcase, Camera, ExternalLink, Loader2, Phone, ScanSearch, ThumbsUp } from "lucide-react";

type Channel = { value: string; source: string } | undefined;
type LeadLike = {
  id: string;
  website?: string;
  email?: string;
  contactEmail?: string;
  emailStatus?: string;
  verificationStatus?: string;
  phone?: string;
  contactChannels?: Partial<Record<"email" | "phone" | "facebook" | "instagram" | "linkedin", Channel>> & { checkedAt?: string };
};

const ICONS = { email: AtSign, phone: Phone, facebook: ThumbsUp, instagram: Camera, linkedin: Briefcase } as const;
const LABELS = { email: "Email", phone: "Phone", facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" } as const;

/** The five ways to reach a lead. Anything not found on the business's own website or listing reads "Not verified". */
export function ContactChannelsPanel({ lead, onLeadUpdate }: { lead: LeadLike; onLeadUpdate: (lead: LeadLike) => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const ch = lead.contactChannels ?? {};

  const rawEmail = lead.email || lead.contactEmail;
  const emailVerified = lead.emailStatus === "VERIFIED" || lead.verificationStatus === "VERIFIED";
  const realEmail = rawEmail && !rawEmail.startsWith("unknown-") ? rawEmail : undefined;
  const rows: { key: keyof typeof ICONS; ch: Channel; unverifiedValue?: string }[] = [
    {
      key: "email",
      ch: ch.email ?? (realEmail && emailVerified ? { value: realEmail, source: "Verified email" } : undefined),
      unverifiedValue: !ch.email && realEmail && !emailVerified ? realEmail : undefined,
    },
    { key: "phone", ch: ch.phone ?? (lead.phone ? { value: lead.phone, source: "Saved" } : undefined) },
    { key: "facebook", ch: ch.facebook },
    { key: "instagram", ch: ch.instagram },
    { key: "linkedin", ch: ch.linkedin },
  ];

  async function find() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/leads/contact-actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "research_channels", leadId: lead.id, websiteUrl: lead.website }),
      });
      const data = (await res.json()) as { ok: boolean; lead?: LeadLike; message?: string; error?: string };
      if (data.lead) onLeadUpdate(data.lead);
      setNote(data.message ?? data.error ?? null);
    } catch {
      setNote("Couldn't reach the server.");
    }
    setBusy(false);
  }

  return (
    <div className="rounded-[8px] border border-(--n-212132) bg-(--n-15151f) p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-(--n-71717a) uppercase">Contact channels</span>
        <button
          type="button"
          onClick={() => void find()}
          disabled={busy || !lead.website}
          title={lead.website ? "Look for email, phone and social links on the website" : "No website on record"}
          className="inline-flex items-center gap-1 rounded-[6px] border border-(--n-2c2c42) bg-(--n-1d1d2c) px-2.5 py-1 text-[11px] text-(--n-d4d4d8) hover:bg-(--n-29293d) disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <ScanSearch className="size-3 text-(--accent)" />}
          Find contacts
        </button>
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {rows.map(({ key, ch: c, unverifiedValue }) => {
          const Icon = ICONS[key];
          const isLink = c && /^https?:\/\//.test(c.value);
          return (
            <li key={key} className="flex min-w-0 items-center gap-2 rounded-[6px] border border-(--n-1f1f2e) bg-(--n-11111a) px-2.5 py-1.5">
              <Icon className={`size-3.5 shrink-0 ${c ? "text-(--accent)" : "text-(--n-555555)"}`} aria-hidden="true" />
              <span className="w-[62px] shrink-0 text-[10px] text-(--n-71717a)">{LABELS[key]}</span>
              {c ? (
                <span className="min-w-0 flex-1">
                  {isLink ? (
                    <a href={c.value} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-[11px] text-(--accent-text) hover:underline">
                      <span className="truncate">{c.value.replace(/^https?:\/\/(www\.)?/, "")}</span>
                      <ExternalLink className="size-2.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="block truncate font-mono text-[11px] text-fg">{c.value}</span>
                  )}
                  <span className="block truncate text-[9.5px] text-(--n-71717a)">{c.source}</span>
                </span>
              ) : (
                <span className="min-w-0 flex-1">
                  {unverifiedValue ? <span className="block truncate font-mono text-[11px] text-(--n-a1a1aa)">{unverifiedValue}</span> : null}
                  <span className="inline-block rounded-full bg-amber-400/15 px-1.5 py-px text-[9.5px] font-semibold text-amber-500">Not verified</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {note ? <p className="mt-2 text-[10.5px] text-(--n-a1a1aa)">{note}</p> : null}
    </div>
  );
}
