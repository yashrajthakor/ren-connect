import { MapPin, Tag, Clock, Phone, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AskStatusBadge, AskPriorityBadge } from "./AskStatusBadge";
import { useAskHistory, useUpdateAsk, useDeleteAsk, ASK_STATUS_LABEL, type Ask, type AskStatus, type MemberLite } from "@/hooks/useAsks";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ask: Ask | null;
  participants: Record<string, MemberLite>;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (ask: Ask) => void;
}

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function digits(s?: string | null) {
  return (s || "").replace(/[^\d+]/g, "");
}

const NEXT_STATUS: Record<AskStatus, AskStatus[]> = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["resolved", "closed", "open"],
  resolved: ["closed", "open"],
  closed: ["open"],
};

export default function AskDetailDialog({ open, onOpenChange, ask, participants, currentUserId, isAdmin, onEdit }: Props) {
  const { data: history = [] } = useAskHistory(ask?.id ?? null);
  const update = useUpdateAsk();
  const del = useDeleteAsk();
  const { toast } = useToast();

  if (!ask) return null;
  const author = participants[ask.user_id];
  const name = author?.name || "REN Member";
  const isOwner = ask.user_id === currentUserId;
  const canManage = isOwner || isAdmin;
  const phone = digits(ask.contact_details);

  const setStatus = async (status: AskStatus) => {
    try {
      await update.mutateAsync({ id: ask.id, patch: { status } });
      toast({ title: `Marked as ${ASK_STATUS_LABEL[status]}` });
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  const removeAsk = async () => {
    if (!confirm("Delete this ask? This cannot be undone.")) return;
    try {
      await del.mutateAsync(ask.id);
      toast({ title: "Ask deleted" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{ask.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <AskStatusBadge status={ask.status} />
            <AskPriorityBadge priority={ask.priority} />
            {ask.category && (
              <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5 text-[11px]">
                <Tag className="h-3 w-3" />{ask.category}
              </span>
            )}
            {ask.city && (
              <span className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5 text-[11px]">
                <MapPin className="h-3 w-3" />{ask.city}
              </span>
            )}
          </div>

          <p className="text-sm text-foreground whitespace-pre-wrap">{ask.description}</p>

          <div className="flex items-center gap-3 border-t border-b border-border py-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author?.avatar_url ?? undefined} alt={name} />
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{name}</p>
              {author?.business && <p className="text-xs text-muted-foreground truncate">{author.business}</p>}
              <span className="inline-flex items-center text-[11px] text-muted-foreground gap-1 mt-0.5">
                <Clock className="h-3 w-3" />Posted {new Date(ask.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {phone && !isOwner && (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="default">
                <a href={`https://wa.me/${phone.replace(/^\+/, "")}?text=${encodeURIComponent(`Hi ${name}, regarding your REN ask: "${ask.title}"`)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`tel:${phone}`}><Phone className="h-4 w-4" /> Call</a>
              </Button>
            </div>
          )}

          {canManage && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Manage status</p>
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUS[ask.status].map((s) => (
                  <Button key={s} size="sm" variant="outline" onClick={() => setStatus(s)} disabled={update.isPending}>
                    Mark {ASK_STATUS_LABEL[s]}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(ask)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={removeAsk}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Status timeline</p>
              <ol className="space-y-2 border-l border-border pl-4">
                {history.map((h) => (
                  <li key={h.id} className="text-sm">
                    <p className="font-medium">
                      {h.from_status ? `${ASK_STATUS_LABEL[h.from_status]} → ` : ""}
                      {ASK_STATUS_LABEL[h.to_status]}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
