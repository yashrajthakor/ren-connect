/** Shared date-range presets for admin dashboard filtering. */

export type DatePreset = "today" | "week" | "month" | "year" | "custom";

export interface SimpleDateRange {
  /** Inclusive. */
  start: Date;
  /** Exclusive. */
  end: Date;
}

export const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  custom: "Custom Range",
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

/**
 * Resolve a preset (or explicit custom from/to) into a concrete [start, end)
 * range. Weeks start on Monday. `custom` is required when preset is "custom".
 */
export function getPresetRange(preset: DatePreset, custom?: { from: Date; to: Date }): SimpleDateRange {
  const now = new Date();

  if (preset === "today") {
    const start = startOfDay(now);
    return { start, end: addDays(start, 1) };
  }
  if (preset === "week") {
    const day = now.getDay(); // 0 = Sunday
    const diffToMonday = (day + 6) % 7;
    const start = addDays(startOfDay(now), -diffToMonday);
    return { start, end: addDays(start, 7) };
  }
  if (preset === "year") {
    return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
  }
  if (preset === "custom" && custom) {
    const start = startOfDay(custom.from);
    const end = addDays(startOfDay(custom.to), 1); // include the whole "to" day
    return { start, end };
  }
  // "month" — also the fallback default
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}
