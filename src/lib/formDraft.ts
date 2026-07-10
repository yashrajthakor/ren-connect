/**
 * Lightweight form-draft persistence so in-progress forms survive the app
 * being backgrounded or reloaded (mobile OSes often kill PWA pages when the
 * user switches apps to copy a phone number etc.).
 *
 * Drafts live in localStorage with a TTL and are cleared on successful
 * submit or when the user explicitly closes the form.
 */

const TTL_MS = 24 * 60 * 60 * 1000; // keep unfinished drafts for a day

export const DRAFT_KEYS = {
  createLead: "rbn_draft_create_lead",
  thankMember: "rbn_draft_thank_member",
  meetingPost: "rbn_draft_meeting_post",
} as const;

export function readFormDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; values?: T } | null;
    if (!parsed || typeof parsed.savedAt !== "number" || parsed.values == null) {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.values;
  } catch {
    return null;
  }
}

export function writeFormDraft<T>(key: string, values: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), values }));
  } catch {
    // Storage full or unavailable — losing the draft is non-fatal.
  }
}

export function clearFormDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
