import { cn } from "@/lib/utils";
import { ASK_STATUS_LABEL, ASK_PRIORITY_LABEL, type AskStatus, type AskPriority } from "@/hooks/useAsks";

export function AskStatusBadge({ status, className }: { status: AskStatus; className?: string }) {
  const styles: Record<AskStatus, string> = {
    open: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    in_progress: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    closed: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        styles[status],
        className
      )}
    >
      {ASK_STATUS_LABEL[status]}
    </span>
  );
}

export function AskPriorityBadge({ priority }: { priority: AskPriority }) {
  const styles: Record<AskPriority, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    high: "bg-primary/15 text-primary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[priority]
      )}
    >
      {ASK_PRIORITY_LABEL[priority]}
    </span>
  );
}
