/**
 * A lead without an email still needs an internal key, stored as "unknown-<time>@domain.com".
 * That key — and old placeholder addresses — must never be shown, pitched or emailed.
 * realEmail() returns the first real address among the candidates, or undefined.
 */
const PLACEHOLDER = /^unknown-|^no-email|@(domain|example|company|prospect)\.(com|org|net)$/i;
const VALID = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function isRealEmail(e: string | null | undefined): e is string {
  return !!e && VALID.test(e.trim()) && !PLACEHOLDER.test(e.trim());
}

export function realEmail(...candidates: (string | null | undefined)[]): string | undefined {
  return candidates.find(isRealEmail)?.trim();
}
