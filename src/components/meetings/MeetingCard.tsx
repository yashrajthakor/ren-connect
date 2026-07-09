import { Calendar, Share2, Pencil, Trash2, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MemberLite } from "@/hooks/useLeads";
import type { Meeting } from "@/hooks/useMeetings";

interface Props {
  meeting: Meeting;
  otherMember?: MemberLite;
  isOwner: boolean;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare: () => void;
}

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function MeetingCard({ meeting, otherMember, isOwner, onView, onEdit, onDelete, onShare }: Props) {
  const date = new Date(meeting.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  const cats = meeting.meeting_with_categories?.length
    ? meeting.meeting_with_categories
    : otherMember?.categories ?? [];

  return (
    <Card className="overflow-hidden flex flex-col">
      {meeting.meeting_photo_url ? (
        <button onClick={onView} className="block w-full">
          <img
            src={meeting.meeting_photo_url}
            alt="Meeting"
            className="w-full h-44 sm:h-52 object-cover"
            loading="lazy"
          />
        </button>
      ) : (
        <div className="w-full h-44 sm:h-52 bg-muted grid place-items-center text-muted-foreground text-sm">
          No photo
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherMember?.avatar_url ?? undefined} />
            <AvatarFallback>{initials(otherMember?.name ?? "?")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{otherMember?.name ?? "Member"}</p>
            <p className="text-xs text-muted-foreground truncate">{otherMember?.business ?? ""}</p>
          </div>
        </div>

        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {cats.slice(0, 3).map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
            ))}
            {cats.length > 3 && (
              <Badge variant="outline" className="text-[10px]">+{cats.length - 3}</Badge>
            )}
          </div>
        )}

        {meeting.discussion_summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">{meeting.discussion_summary}</p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{date}</span>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="outline" onClick={onView} className="flex-1 min-w-0">
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <Button size="sm" variant="outline" onClick={onShare} className="flex-1 min-w-0">
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
          {isOwner && onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {isOwner && onDelete && (
            <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}