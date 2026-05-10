import { MapPin, Tag, Clock, Phone, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AskStatusBadge, AskPriorityBadge } from "./AskStatusBadge";
import type { Ask, MemberLite } from "@/hooks/useAsks";

interface Props {
  ask: Ask;
  participants: Record<string, MemberLite>;
  onClick: () => void;
}

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function digits(s?: string | null) {
  return (s || "").replace(/[^\d+]/g, "");
}

export function AskCard({ ask, participants, onClick }: Props) {
  const author = participants[ask.user_id];
  const name = author?.name || "REN Member";
  const phone = digits(ask.contact_details);
  const waUrl = phone ? `https://wa.me/${phone.replace(/^\+/, "")}?text=${encodeURIComponent(`Hi ${name}, regarding your REN ask: "${ask.title}"`)}` : null;
  const callUrl = phone ? `tel:${phone}` : null;

  return (
    <Card onClick={onClick} className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display font-semibold text-base text-foreground line-clamp-2 flex-1">{ask.title}</h3>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <AskStatusBadge status={ask.status} />
          <AskPriorityBadge priority={ask.priority} />
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{ask.description}</p>

      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mb-3">
        {ask.category && (
          <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5">
            <Tag className="h-3 w-3" />{ask.category}
          </span>
        )}
        {ask.city && (
          <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5">
            <MapPin className="h-3 w-3" />{ask.city}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 gap-2 mt-auto">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7">
            <AvatarImage src={author?.avatar_url ?? undefined} alt={name} />
            <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            <span className="inline-flex items-center text-[11px] text-muted-foreground gap-1">
              <Clock className="h-3 w-3" />{new Date(ask.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {(waUrl || callUrl) && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {waUrl && (
            <Button asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
          )}
          {callUrl && (
            <Button asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
              <a href={callUrl}>
                <Phone className="h-4 w-4" /> Call
              </a>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
