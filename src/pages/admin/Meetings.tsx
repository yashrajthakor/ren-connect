import { useState, useMemo } from "react";
import { Search, Handshake } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useAdminMeetings, useDeleteMeeting, buildWhatsappShareText, type Meeting,
} from "@/hooks/useMeetings";
import MeetingCard from "@/components/meetings/MeetingCard";
import MeetingDetailDialog from "@/components/meetings/MeetingDetailDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminMeetings() {
  const { data, isLoading } = useAdminMeetings(true);
  const deleteMut = useDeleteMeeting();
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
    const text = buildWhatsappShareText(m, participants);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMut.mutateAsync(toDelete.id);
      toast({ title: "Meeting deleted" });
      setToDelete(null);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">1-to-1 Meetings</h1>
        <p className="text-muted-foreground text-sm mt-1">All meeting logs across RBN members.</p>
      </div>

      <div className="relative mb-5 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by member, business, or discussion..."
          className="pl-9 h-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Loading meetings…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">No meetings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              otherMember={participants[m.meeting_with_user_id]}
              isOwner
              onView={() => setViewing(m)}
              onDelete={() => setToDelete(m)}
              onShare={() => share(m)}
            />
          ))}
        </div>
      )}

      <MeetingDetailDialog
        meeting={viewing}
        participants={participants}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        onShare={share}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this meeting log.
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