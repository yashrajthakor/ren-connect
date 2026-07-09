import { useState, useMemo } from "react";
import { Search, Rss } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useAdminMeetings, useDeleteMeeting, useSetPublished, shareMeetingViaWhatsapp, type Meeting,
} from "@/hooks/useMeetings";
import FeedCard from "@/components/meetings/MeetingCard";
import FeedDetailDialog from "@/components/meetings/MeetingDetailDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminMeetings() {
  const { data, isLoading } = useAdminMeetings(true);
  const deleteMut = useDeleteMeeting();
  const publishMut = useSetPublished();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Meeting | null>(null);
  const [toDelete, setToDelete] = useState<Meeting | null>(null);

  const meetings = data?.meetings ?? [];
  const participants = data?.participants ?? {};

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return meetings;
    return meetings.filter((m) => {
      const by = participants[m.meeting_by_user_id];
      const wth = participants[m.meeting_with_user_id];
      return (
        by?.name?.toLowerCase().includes(query) ||
        wth?.name?.toLowerCase().includes(query) ||
        by?.business?.toLowerCase().includes(query) ||
        wth?.business?.toLowerCase().includes(query) ||
        m.discussion_summary.toLowerCase().includes(query)
      );
    });
  }, [meetings, participants, q]);

  const share = (m: Meeting) => {
    void shareMeetingViaWhatsapp(m, participants);
  };

  const handleTogglePublish = async (m: Meeting) => {
    try {
      await publishMut.mutateAsync({ id: m.id, is_published: !m.is_published });
      toast({ title: m.is_published ? "Post hidden from feed" : "Post shown on feed" });
    } catch (e: any) {
      toast({ title: "Could not update", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMut.mutateAsync(toDelete.id);
      toast({ title: "Networking log deleted" });
      setToDelete(null);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Rss className="h-6 w-6 text-primary" /> Networking Feed
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View every networking log across RBN. Hide or delete inappropriate posts.
          </p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by member or discussion..."
          className="pl-9 h-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Loading networking logs…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Rss className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">No networking logs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <FeedCard
              key={m.id}
              meeting={m}
              byMember={participants[m.meeting_by_user_id]}
              withMember={participants[m.meeting_with_user_id]}
              variant="admin"
              onView={() => setViewing(m)}
              onDelete={() => setToDelete(m)}
              onShare={() => share(m)}
              onTogglePublish={() => handleTogglePublish(m)}
              togglingPublish={publishMut.isPending && (publishMut.variables as { id: string } | undefined)?.id === m.id}
            />
          ))}
        </div>
      )}

      <FeedDetailDialog
        meeting={viewing}
        participants={participants}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        onShare={share}
        showStatus
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete networking log?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this networking log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
