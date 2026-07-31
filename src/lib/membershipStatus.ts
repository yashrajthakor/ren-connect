/** Shared membership-validity classification for the Valuable Members module. */

export type MembershipStatus = "active" | "expiring_soon" | "expired" | "unknown";

/** Days remaining are "expiring soon" inside this rolling window. */
const EXPIRING_SOON_DAYS = 30;

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateOnly(value: string): Date {
  return new Date(value + "T00:00:00");
}

/** Whole days from today until `validThrough` (negative if already past). */
export function daysRemaining(validThrough: string | null | undefined): number | null {
  if (!validThrough) return null;
  const diffMs = parseDateOnly(validThrough).getTime() - today().getTime();
  return Math.round(diffMs / 86_400_000);
}

export function getMembershipStatus(validThrough: string | null | undefined): MembershipStatus {
  const remaining = daysRemaining(validThrough);
  if (remaining === null) return "unknown";
  if (remaining < 0) return "expired";
  if (remaining <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "active";
}

/** True when `validThrough` falls within the current calendar month and hasn't already passed. */
export function isExpiringThisMonth(validThrough: string | null | undefined): boolean {
  if (!validThrough) return false;
  const vt = parseDateOnly(validThrough);
  const t = today();
  return vt.getFullYear() === t.getFullYear() && vt.getMonth() === t.getMonth() && vt >= t;
}

export const MEMBERSHIP_STATUS_LABEL: Record<MembershipStatus, string> = {
  active: "Active",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  unknown: "Not Available",
};

export function formatDateOrNA(value: string | null | undefined): string {
  if (!value) return "Not Available";
  return parseDateOnly(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
