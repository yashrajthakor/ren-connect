import { Calendar, Share2, Pencil, Trash2, Eye, Globe, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MemberLite } from "@/hooks/useLeads";
import type { Meeting } from "@/hooks/useMeetings";

export type FeedCardVariant = "feed" | "mine" | "admin";

interface Props {
  meeting: Meeting;
  byMember?: MemberLite;
  withMember?: MemberLite;
  variant: FeedCardVariant;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare: () => void;
  onTogglePublish?: () => void;
  togglingPublish?: boolean;
}

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function MiniMember({ label, member }: { label: string; member?: MemberLite }) {
  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={member?.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{initials(member?.name ?? "?")}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground truncate leading-tight">{member?.name ?? "Member"}</p>
      </div>
    </div>
  );
}

export default function FeedCard({
  meeting, byMember, withMember, variant, onView, onEdit, onDelete, onShare, onTogglePublish, togglingPublish,
}: Props) {
  const date = new Date(meeting.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  const categories = Array.from(
    new Set([...(meeting.meeting_by_categories || []), ...(meeting.meeting_with_categories || [])])
  );

  const showStatusBadge = variant === "mine" || variant === "admin";
  const publishLabel = variant === "admin"
    ? (meeting.is_published ? "Hide" : "Unhide")
    : (meeting.is_published ? "Unpublish" : "Publish");
  const PublishIcon = meeting.is_published ? Lock : Globe;

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative">
        {meeting.meeting_photo_url ? (
          <button onClick={onView} className="block w-full">
            <img
              src={meeting.meeting_photo_url}
              alt="Networking meeting"
              className="w-full h-44 sm:h-52 object-cover"
              loading="lazy"
            />
          </button>
        ) : (
          <div className="w-full h-44 sm:h-52 bg-muted grid place-items-center text-muted-foreground text-sm">
            No photo
          </div>
        )}
        {showStatusBadge && (
          <Badge
            variant={meeting.is_published ? "default" : "secondary"}
            className="absolute top-2 right-2 text-[10px] shadow"
          >
            {meeting.is_published ? "Published" : "Private"}
          </Badge>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <MiniMember label="Meeting By" member={byMember} />
          <span className="text-muted-foreground text-sm shrink-0">🤝</span>
          <MiniMember label="Meeting With" member={withMember} />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 4).map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
            ))}
            {categories.length > 4 && (
              <Badge variant="outline" className="text-[10px]">+{categories.length - 4}</Badge>
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
          {variant === "mine" && onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onTogglePublish && (
            <Button size="sm" variant="outline" onClick={onTogglePublish} disabled={togglingPublish}>
              <PublishIcon className="h-3.5 w-3.5" /> {publishLabel}
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
