import { Inbox, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadStatus, LeadPriority } from "@/hooks/useLeads";
import { STATUS_LABEL, PRIORITY_LABEL } from "@/hooks/useLeads";

export function LeadStatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const styles: Record<LeadStatus, string> = {
    pending: "bg-secondary text-secondary-foreground",
    in_process: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    business_closed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    rejected: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        styles[status],
        className
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Distinguishes, at a glance, whether a lead was given to or received from another member. */
export function LeadDirectionBadge({ isReceiver }: { isReceiver: boolean }) {
  return isReceiver ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300 whitespace-nowrap">
      <Inbox className="h-3 w-3" />
      Leads Received
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300 whitespace-nowrap">
      <Send className="h-3 w-3" />
      Leads Given
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  const styles: Record<LeadPriority, string> = {
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
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
