import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEMBERSHIP_STATUS_LABEL, type MembershipStatus } from "@/lib/membershipStatus";

const STYLES: Record<MembershipStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  expiring_soon: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  expired: "bg-destructive/15 text-destructive",
  unknown: "bg-muted text-muted-foreground",
};

const DOT: Record<MembershipStatus, string> = {
  active: "fill-emerald-500 text-emerald-500",
  expiring_soon: "fill-amber-500 text-amber-500",
  expired: "fill-destructive text-destructive",
  unknown: "fill-muted-foreground text-muted-foreground",
};

export function MembershipStatusBadge({ status, className }: { status: MembershipStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STYLES[status],
        className
      )}
    >
      <Circle className={cn("h-2 w-2", DOT[status])} />
      {MEMBERSHIP_STATUS_LABEL[status]}
    </span>
  );
}
