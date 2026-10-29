export function buildMeetingCheckinUrl(token: string): string {
  return `${window.location.origin}/attend/${token}`;
}

/** Accepts the full check-in URL (from any host) or a bare token; null for anything else, e.g. a member's personal QR. */
export function extractCheckinToken(scanned: string): string | null {
  const text = scanned.trim();
  const fromUrl = text.match(/\/attend\/([a-f0-9]{32})(?:[/?#]|$)/i);
  if (fromUrl) return fromUrl[1].toLowerCase();
  return /^[a-f0-9]{32}$/i.test(text) ? text.toLowerCase() : null;
}
