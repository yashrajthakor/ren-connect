import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { meetingTypeStyle, DEFAULT_MEETING_TYPE } from "@/lib/meetingType";

export function MeetingTypeBadge({ type, className }: { type: string | null | undefined; className?: string }) {
  const style = meetingTypeStyle(type);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        style.bg,
        style.text,
        className
      )}
    >
      <Circle className={cn("h-2 w-2", style.dot)} />
      {type || DEFAULT_MEETING_TYPE}
    </span>
  );
}

export default MeetingTypeBadge;
