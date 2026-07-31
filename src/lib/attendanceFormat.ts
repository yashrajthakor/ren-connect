/** Shared formatting helpers for the Meeting Attendance module. */

/** "14:05:00" or "14:05" -> "02:05 PM". Purely string-based — no Date/timezone involved. */
export function formatTimeOfDay(value: string | null | undefined): string {
  if (!value) return "Not Available";
  const [hStr, mStr] = value.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return "Not Available";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${mStr} ${period}`;
}

/** A `timestamptz` string -> local wall-clock time, e.g. "09:31 AM". */
export function formatCheckInTime(value: string | null | undefined): string {
  if (!value) return "Not Available";
  return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
