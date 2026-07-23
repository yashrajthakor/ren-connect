import { Phone, Share2, Eye, Pencil, UserRound, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadStatusBadge, LeadDirectionBadge } from "./LeadStatusBadge";
import { cn } from "@/lib/utils";
import type { Lead, MemberLite, LeadPriority } from "@/hooks/useLeads";

interface Props {
  lead: Lead;
  participants: Record<string, MemberLite>;
  currentUserId: string;
  onClick: () => void;
  /** Only rendered when the caller passes it AND the current user is allowed to edit this lead. */
  onEdit?: () => void;
}

// Priority is shown as a left-edge accent rather than another badge, per the
// "color only for Lead Type / Status / Priority" rule — keeps the header to
// exactly two badges while still surfacing priority at a glance.
const PRIORITY_ACCENT: Record<LeadPriority, string> = {
  low: "border-l-border",
  medium: "border-l-amber-400",
  high: "border-l-primary",
};

function buildWhatsAppMessage(
  lead: Lead,
  giver: MemberLite | undefined,
  receiver: MemberLite | undefined
) {
  const giverName = giver?.name || "Unknown giver";
  const giverCategories =
    (giver?.categories && giver.categories.length > 0
      ? giver.categories.join(", ")
      : giver?.category) || "N/A";
  const giverPhone = giver?.phone || "N/A";

  const receiverName = receiver?.name || "Unknown receiver";
  const receiverCategories =
    (receiver?.categories && receiver.categories.length > 0
      ? receiver.categories.join(", ")
      : receiver?.category) || "N/A";
  const receiverPhone = receiver?.phone || "N/A";

  const businessTitle = lead.description || lead.lead_name || "Not available";
  const amount = lead.closure_amount != null ? `₹${Number(lead.closure_amount).toLocaleString("en-IN")}` : "Not available";
  const note = lead.thank_you_note || "No note provided.";

  if (lead.is_direct_business) {
    return `🤝 Business Appreciation

I would like to thank ${giverName} for giving me a business opportunity.

💼 Work:
${businessTitle}

💰 Business Amount:
${amount}

📝 Note:
"${note}"

Shared via RBN Portal`;
  }

  const leadDetails = lead.description || lead.lead_name || "No details provided.";

  return `📌 RBN Business Lead Reference

👤 Receiver Details:
Name: ${receiverName}
Category: ${receiverCategories}
Mobile Number: ${receiverPhone}

🤝 Giver Details:
Name: ${giverName}
Category: ${giverCategories}
Mobile Number: ${giverPhone}

📋 Lead Details:
${leadDetails}

🚀 Published through RBN – Rajput Business Network`;
}

export function LeadCard({ lead, participants, currentUserId, onClick, onEdit }: Props) {
  const isReceiver = lead.receiver_id === currentUserId;
  const giver = participants[lead.giver_id];
  const receiver = participants[lead.receiver_id];
  const counterpart = isReceiver ? giver : receiver;
  const counterName = counterpart?.name || (isReceiver ? "Unknown giver" : "Unknown receiver");
  const isDirect = !!lead.is_direct_business;
  // Lead Name/Contact represent an external customer rather than the giver.
  const isExternal = !isDirect && lead.lead_type === "external";
  // Only the giver can edit, and only before the receiver has acted on it.
  const canEdit = !isDirect && !isReceiver && lead.status === "pending" && !!onEdit;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    buildWhatsAppMessage(lead, giver, receiver)
  )}`;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-3.5 cursor-pointer border-l-4 transition-all hover:shadow-md hover:border-primary/40",
        isDirect ? "bg-primary/5 border-primary/30" : PRIORITY_ACCENT[lead.priority]
      )}
    >
      {/* Header: name + contact, badges top-right */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-display font-semibold text-sm text-foreground truncate">
              {isDirect ? (lead.description || "Direct Business") : lead.lead_name}
            </h3>
            {isExternal && (
              <Badge variant="outline" className="shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0">
                External
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            {isDirect ? (
              <>
                <Heart className="h-3 w-3 shrink-0" />
                <span>Business Appreciation</span>
              </>
            ) : (
              <>
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.contact_number}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isDirect && <LeadDirectionBadge isReceiver={isReceiver} />}
          <LeadStatusBadge status={lead.status} />
        </div>
      </div>

      {/* Description — 2-line limit */}
      {!isDirect && lead.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{lead.description}</p>
      )}
      {isDirect && lead.thank_you_note && (
        <p className="text-xs text-muted-foreground italic line-clamp-2 mt-2">“{lead.thank_you_note}”</p>
      )}

      {/* Compact bottom info row: counterpart + amount — one line, no repeated labels */}
      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 min-w-0">
          <UserRound className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {isDirect
              ? (isReceiver ? "Thanks to" : "Appreciated by")
              : (isReceiver ? "Received From" : "Assigned To")}
            {": "}
            <span className="font-medium text-foreground">{counterName}</span>
          </span>
        </div>
        {lead.status === "business_closed" && lead.closure_amount != null && (
          <span className="shrink-0 font-medium text-foreground">
            ₹{Number(lead.closure_amount).toLocaleString("en-IN")}
          </span>
        )}
      </div>

      {/* Compact icon actions */}
      <div className="flex items-center gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </a>
        <button
          type="button"
          onClick={onClick}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
          Details
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>
    </Card>
  );
}
