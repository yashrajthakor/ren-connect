/**
 * Directory membership gate — shared by the public /directory page and the
 * member-facing dashboard directory (both list from the same RPC).
 *
 * 1 = only active Valuable/Paid Members are listed (current behavior).
 * 0 = every active member is listed, visitors included (pre-2026-09 behavior).
 * Flip this one value to reset — no other change needed on either page.
 */
export const DIRECTORY_VALUABLE_MEMBERS_ONLY: 0 | 1 = 1;

export function isDirectoryListed(membershipType?: "visitor" | "paid_member" | null): boolean {
  return DIRECTORY_VALUABLE_MEMBERS_ONLY === 0 || membershipType === "paid_member";
}
