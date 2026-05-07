import { Phone, ArrowRight, Clock, IndianRupee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeadStatusBadge, PriorityBadge } from "./LeadStatusBadge";
import type { Lead, MemberLite } from "@/hooks/useLeads";

interface Props {
  lead: Lead;
  participants: Record<string, MemberLite>;
  currentUserId: string;
  onClick: () => void;
}

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function LeadCard({ lead, participants, currentUserId, onClick }: Props) {
  const isReceiver = lead.receiver_id === currentUserId;
  const counterpart = participants[isReceiver ? lead.giver_id : lead.receiver_id];
  const counterName = counterpart?.name || (isReceiver ? "Unknown giver" : "Unknown receiver");

  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-base text-foreground truncate">
            {lead.lead_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Phone className="h-3.5 w-3.5" />
            <span className="truncate">{lead.contact_number}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <LeadStatusBadge status={lead.status} />
          <PriorityBadge priority={lead.priority} />
        </div>
      </div>

      {lead.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lead.description}</p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7">
            <AvatarImage src={counterpart?.avatar_url ?? undefined} alt={counterName} />
            <AvatarFallback className="text-[10px]">{initials(counterName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none">
              {isReceiver ? "From" : "To"}
            </p>
            <p className="text-sm font-medium truncate">{counterName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          {lead.status === "business_closed" && lead.closure_amount != null && (
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
              <IndianRupee className="h-3 w-3" />
              {Number(lead.closure_amount).toLocaleString("en-IN")}
            </span>
          )}
          <span className="inline-flex items-center text-[11px] text-muted-foreground gap-1">
            <Clock className="h-3 w-3" />
            {new Date(lead.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );
}
