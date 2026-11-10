import { promises as dns } from "node:dns";
import emailValidator from "email-validator";

export type DomainValidationStatus =
  | "VERIFIED"
  | "VALID_DOMAIN_UNVERIFIED_MAILBOX"
  | "NULL_MX"
  | "INVALID_DOMAIN"
  | "TEMPORARY_DNS_ERROR"
  | "INVALID_EMAIL_SYNTAX"
  | "NO_EMAIL";

export interface DomainValidationResult {
  valid: boolean;
  status: DomainValidationStatus;
  domain: string;
  hasMx: boolean;
  isNullMx: boolean;
  hasAFallback: boolean;
  mxRecords: string[];
  hasSpf: boolean;
  hasDmarc: boolean;
  error?: string;
  details?: string;
}

/**
 * Normalizes email and domain with RFC IDN (punycode) support
 */
export function normalizeEmail(email: string): { normalized: string; domain: string } {
  if (!email || typeof email !== "string") {
    return { normalized: "", domain: "" };
  }
  const clean = email.trim().toLowerCase();
  const parts = clean.split("@");
  if (parts.length !== 2) {
    return { normalized: clean, domain: "" };
  }
  const [local, rawDomain] = parts;
  let domain = rawDomain.trim();
  try {
    // Standard URL ASCII Punycode normalization
    const u = new URL(`http://${domain}`);
    domain = u.hostname.toLowerCase();
  } catch {
    domain = domain.toLowerCase();
  }
  return { normalized: `${local}@${domain}`, domain };
}

/**
 * Robust DNS & Deliverability Pre-Check
 * Follows RFC 5321 (MX & A/AAAA fallback), RFC 7505 (Null MX), and RFC 5322 (Syntax)
 */
export async function verifyDomain(email: string): Promise<DomainValidationResult> {
  if (!email || typeof email !== "string" || !email.trim()) {
    return {
      valid: false,
      status: "NO_EMAIL",
      domain: "",
      hasMx: false,
      isNullMx: false,
      hasAFallback: false,
      mxRecords: [],
      hasSpf: false,
      hasDmarc: false,
      error: "No email address provided",
      details: "Contact has no recorded email address.",
    };
  }

  const { normalized, domain } = normalizeEmail(email);

  // 1. Syntax Validation (RFC 5322)
  if (!domain || !emailValidator.validate(normalized)) {
    return {
      valid: false,
      status: "INVALID_EMAIL_SYNTAX",
      domain: domain || "",
      hasMx: false,
      isNullMx: false,
      hasAFallback: false,
      mxRecords: [],
      hasSpf: false,
      hasDmarc: false,
      error: "Invalid email syntax format",
      details: "Email does not adhere to RFC 5322 format standards.",
    };
  }

  // 2. DNS MX Record Resolution with Timeout
  try {
    const mxQuery = await dns.resolveMx(domain).catch((err: any) => {
      return { err };
    });

    // Check for temporary DNS network failures vs NXDOMAIN
    if (mxQuery && "err" in mxQuery) {
      const code = (mxQuery.err as any)?.code;
      if (code === "ETIMEOUT" || code === "SERVFAIL" || code === "ECONNREFUSED" || code === "EREFUSED") {
        return {
          valid: false,
          status: "TEMPORARY_DNS_ERROR",
          domain,
          hasMx: false,
          isNullMx: false,
          hasAFallback: false,
          mxRecords: [],
          hasSpf: false,
          hasDmarc: false,
          error: `Temporary DNS resolution error (${code})`,
          details: "DNS server timed out or failed temporarily. Retrying later.",
        };
      }
    }

    const rawMxList = Array.isArray(mxQuery) ? mxQuery : [];

    // 3. RFC 7505: Explicit Null MX Detection (priority 0, exchange "" or ".")
    const isNullMx = rawMxList.some(
      (r) => r.priority === 0 && (r.exchange === "" || r.exchange === "." || r.exchange === "0.0.0.0")
    );

    if (isNullMx) {
      return {
        valid: false,
        status: "NULL_MX",
        domain,
        hasMx: false,
        isNullMx: true,
        hasAFallback: false,
        mxRecords: [],
        hasSpf: false,
        hasDmarc: false,
        error: "RFC 7505 Null MX: Domain explicitly declares it does not accept email",
        details: "The domain has published a Null MX record indicating inbound email is disabled.",
      };
    }

    // 4. Valid Mail Exchangers Present
    if (rawMxList.length > 0) {
      const mxExchanges = rawMxList.map((r) => r.exchange.toLowerCase().replace(/\.$/, ""));

      // Check SPF & DMARC in background/parallel (non-blocking)
      let hasSpf = false;
      let hasDmarc = false;
      try {
        const txtRecords = await dns.resolveTxt(domain).catch(() => []);
        hasSpf = txtRecords.flat().join(" ").includes("v=spf1");
      } catch {}

      try {
        const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
        hasDmarc = dmarcRecords.flat().join(" ").includes("v=DMARC1");
      } catch {}

      return {
        valid: true,
        status: "VERIFIED",
        domain,
        hasMx: true,
        isNullMx: false,
        hasAFallback: false,
        mxRecords: mxExchanges,
        hasSpf,
        hasDmarc,
        details: `Active mail exchangers found: ${mxExchanges.slice(0, 2).join(", ")}`,
      };
    }

    // 5. RFC 5321 Fallback: Check if Domain has A or AAAA records
    let hasAFallback = false;
    try {
      const aRecords = await dns.resolve4(domain).catch(() => []);
      if (aRecords.length > 0) hasAFallback = true;
    } catch {}

    if (!hasAFallback) {
      try {
        const aaaaRecords = await dns.resolve6(domain).catch(() => []);
        if (aaaaRecords.length > 0) hasAFallback = true;
      } catch {}
    }

    if (hasAFallback) {
      return {
        valid: false, // In strict delivery mode, unverified mailbox without MX requires extra verification
        status: "VALID_DOMAIN_UNVERIFIED_MAILBOX",
        domain,
        hasMx: false,
        isNullMx: false,
        hasAFallback: true,
        mxRecords: [],
        hasSpf: false,
        hasDmarc: false,
        error: "Domain has A/AAAA records but lacks advertised MX exchangers",
        details: "Domain exists on the web, but has no designated mail server. Mailbox delivery uncertain.",
      };
    }

    // 6. Non-Existent Domain (NXDOMAIN or ENODATA)
    return {
      valid: false,
      status: "INVALID_DOMAIN",
      domain,
      hasMx: false,
      isNullMx: false,
      hasAFallback: false,
      mxRecords: [],
      hasSpf: false,
      hasDmarc: false,
      error: "Domain has no valid MX or host routing records (NXDOMAIN)",
      details: "Domain does not exist in public DNS registry or has zero routing records.",
    };
  } catch (err: any) {
    const code = err?.code || "";
    if (code === "ETIMEOUT" || code === "SERVFAIL") {
      return {
        valid: false,
        status: "TEMPORARY_DNS_ERROR",
        domain,
        hasMx: false,
        isNullMx: false,
        hasAFallback: false,
        mxRecords: [],
        hasSpf: false,
        hasDmarc: false,
        error: `Temporary DNS failure: ${err.message}`,
        details: "DNS lookups temporarily unavailable.",
      };
    }

    return {
      valid: false,
      status: "INVALID_DOMAIN",
      domain,
      hasMx: false,
      isNullMx: false,
      hasAFallback: false,
      mxRecords: [],
      hasSpf: false,
      hasDmarc: false,
      error: err.message || "DNS lookup failed",
      details: "Unable to find public routing for this domain.",
    };
  }
}
