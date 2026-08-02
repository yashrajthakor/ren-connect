/** Shared Meeting Type color mapping for the Attendance module. */

export const DEFAULT_MEETING_TYPE = "Regular Meeting";

interface MeetingTypeStyle {
  dot: string;
  text: string;
  bg: string;
}

const REGULAR_STYLE: MeetingTypeStyle = {
  dot: "fill-orange-500 text-orange-500",
  text: "text-orange-700 dark:text-orange-300",
  bg: "bg-orange-500/15",
};

/** Fixed palette custom types are hashed into, so the same type string
 * always renders with the same color everywhere in the app. */
const PALETTE: MeetingTypeStyle[] = [
  { dot: "fill-blue-500 text-blue-500", text: "text-blue-700 dark:text-blue-300", bg: "bg-blue-500/15" },
  { dot: "fill-purple-500 text-purple-500", text: "text-purple-700 dark:text-purple-300", bg: "bg-purple-500/15" },
  { dot: "fill-pink-500 text-pink-500", text: "text-pink-700 dark:text-pink-300", bg: "bg-pink-500/15" },
  { dot: "fill-teal-500 text-teal-500", text: "text-teal-700 dark:text-teal-300", bg: "bg-teal-500/15" },
  { dot: "fill-indigo-500 text-indigo-500", text: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-500/15" },
  { dot: "fill-slate-400 text-slate-400", text: "text-slate-700 dark:text-slate-300", bg: "bg-slate-500/15" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function meetingTypeStyle(type: string | null | undefined): MeetingTypeStyle {
  const normalized = (type || "").trim();
  if (!normalized || normalized === DEFAULT_MEETING_TYPE) return REGULAR_STYLE;
  return PALETTE[hashString(normalized) % PALETTE.length];
}
