import { Calendar, Share2, Globe, Lock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MemberLite } from "@/hooks/useLeads";
import type { Meeting } from "@/hooks/useMeetings";

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

interface Props {
  meeting: Meeting | null;
  participants: Record<string, MemberLite>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onShare: (m: Meeting) => void;
  showStatus?: boolean;
}

export default function FeedDetailDialog({ meeting, participants, open, onOpenChange, onShare, showStatus }: Props) {
  if (!meeting) return null;
  const by = participants[meeting.meeting_by_user_id];
  const wth = participants[meeting.meeting_with_user_id];
  const date = new Date(meeting.created_at).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Networking meeting
            {showStatus && (
              <Badge variant={meeting.is_published ? "default" : "secondary"} className="text-[10px]">
                {meeting.is_published ? (
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Published</span>
                ) : (
                  <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
                )}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {meeting.meeting_photo_url && (
          <img
            src={meeting.meeting_photo_url}
            alt="Networking meeting"
            className="w-full max-h-72 object-cover rounded-lg"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <MemberBlock label="Meeting By" member={by} categories={meeting.meeting_by_categories} />
          <MemberBlock label="Meeting With" member={wth} categories={meeting.meeting_with_categories} />
        </div>

        {meeting.discussion_summary && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Discussion Summary</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{meeting.discussion_summary}</p>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{date}</span>
        </div>

        <Button onClick={() => onShare(meeting)} className="w-full">
          <Share2 className="h-4 w-4" /> Share via WhatsApp
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function MemberBlock({ label, member, categories }: { label: string; member?: MemberLite; categories: string[] }) {
  return (
    <div className="border rounded-lg p-3 space-y-2 min-w-0">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">{initials(member?.name ?? "?")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{member?.name ?? "Member"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{member?.business ?? ""}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {(categories || []).slice(0, 3).map((c) => (
          <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
        ))}
      </div>
    </div>
  );
}
