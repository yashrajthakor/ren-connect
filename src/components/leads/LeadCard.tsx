import { Phone, Clock, IndianRupee, Share2, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function LeadCard({ lead, participants, currentUserId, onClick }: Props) {
  const isReceiver = lead.receiver_id === currentUserId;
  const giver = participants[lead.giver_id];
  const receiver = participants[lead.receiver_id];
  const counterpart = isReceiver ? giver : receiver;
  const counterName = counterpart?.name || (isReceiver ? "Unknown giver" : "Unknown receiver");
  const isDirect = !!lead.is_direct_business;
  // Lead Name/Contact represent an external customer rather than the giver.
  const isExternal = !isDirect && lead.lead_type === "external";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    buildWhatsAppMessage(lead, giver, receiver)
  )}`;

  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all ${
        isDirect ? "bg-primary/5 border-primary/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-display font-semibold text-base text-foreground truncate">
              {isDirect ? (lead.description || "Direct Business") : lead.lead_name}
            </h3>
            {isExternal && (
              <Badge variant="outline" className="shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0">
                External
              </Badge>
            )}
          </div>
          {isDirect ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-1">
              <Heart className="h-3.5 w-3.5 fill-primary" />
              <span>Business Appreciation</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Phone className="h-3.5 w-3.5" />
              <span className="truncate">{lead.contact_number}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <LeadStatusBadge status={lead.status} />
          {!isDirect && <PriorityBadge priority={lead.priority} />}
        </div>
      </div>

      {!isDirect && lead.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lead.description}</p>
      )}
      {isDirect && lead.thank_you_note && (
        <p className="text-sm text-foreground/80 italic line-clamp-2 mb-3 border-l-2 border-primary/40 pl-2">
          “{lead.thank_you_note}”
        </p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7">
            <AvatarImage src={counterpart?.avatar_url ?? undefined} alt={counterName} />
            <AvatarFallback className="text-[10px]">{initials(counterName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none">
              {isDirect ? (isReceiver ? "Thanks to" : "Appreciated by") : (isReceiver ? "From" : "To")}
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

      <div className="mt-4">
        <Button variant="outline" size="sm" asChild className="w-full" onClick={(e) => e.stopPropagation()}>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Share2 className="h-4 w-4" />
            {isDirect ? "Share on WhatsApp" : "Share Lead"}
          </a>
        </Button>
      </div>
    </Card>
  );
}
