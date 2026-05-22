import { Clock, XCircle } from "lucide-react";
import { useMemberStatus } from "@/hooks/useMemberStatus";

export default function PendingApprovalBanner() {
  const { isPending, isRejected } = useMemberStatus();

  if (isRejected) {
    return (
      <div className="border-b border-destructive/30 bg-destructive/10 text-destructive">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-sm">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>
            Your application was not approved. Please contact support for assistance.
          </span>
        </div>
      </div>
    );
  }

  if (!isPending) return null;

  return (
    <div className="border-b border-primary/30 bg-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-sm text-foreground">
        <Clock className="h-4 w-4 shrink-0 text-primary animate-pulse" />
        <span>
          <strong>Your profile is under review.</strong> Some features (Leads, Ask Network) are temporarily restricted until admin approval.
        </span>
      </div>
    </div>
  );
}