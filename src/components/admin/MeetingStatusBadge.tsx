import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MeetingStatus } from "@/hooks/useAttendanceMeetings";

const LABEL: Record<MeetingStatus, string> = {
  upcoming: "Upcoming",
  live: "Live",
  completed: "Completed",
};

const STYLES: Record<MeetingStatus, string> = {
  upcoming: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  live: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  completed: "bg-muted text-muted-foreground",
};

const DOT: Record<MeetingStatus, string> = {
  upcoming: "fill-amber-500 text-amber-500",
  live: "fill-emerald-500 text-emerald-500 animate-pulse",
  completed: "fill-muted-foreground text-muted-foreground",
};

export function MeetingStatusBadge({ status, className }: { status: MeetingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STYLES[status],
        className
      )}
    >
      <Circle className={cn("h-2 w-2", DOT[status])} />
      {LABEL[status]}
    </span>
  );
}
