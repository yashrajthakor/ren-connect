import { useState, useMemo } from "react";
import { Plus, Search, Handshake } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PendingApprovalGate from "@/components/dashboard/PendingApprovalGate";
import { useCurrentUserId } from "@/hooks/useLeads";
import {
  useMyMeetings, useDeleteMeeting, buildWhatsappShareText, type Meeting,
} from "@/hooks/useMeetings";
import MeetingCard from "@/components/meetings/MeetingCard";
import CreateMeetingDialog from "@/components/meetings/CreateMeetingDialog";
import MeetingDetailDialog from "@/components/meetings/MeetingDetailDialog";
import { useToast } from "@/hooks/use-toast";

function MeetingsInner() {
  const { data: userId } = useCurrentUserId();
  const { data, isLoading } = useMyMeetings(userId);
  const deleteMut = useDeleteMeeting();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [viewing, setViewing] = useState<Meeting | null>(null);
  const [toDelete, setToDelete] = useState<Meeting | null>(null);

  const meetings = data?.meetings ?? [];
  const participants = data?.participants ?? {};

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return meetings;
    return meetings.filter((m) => {
      const other = participants[m.meeting_with_user_id];
      return (
        other?.name?.toLowerCase().includes(query) ||
        other?.business?.toLowerCase().includes(query) ||
        m.discussion_summary.toLowerCase().includes(query)
      );
    });
  }, [meetings, participants, q]);

  const share = (m: Meeting) => {
    const text = buildWhatsappShareText(m, participants);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    if (m.meeting_photo_url) {
      toast({
        title: "Photo ready to attach",
        description: "Attach the meeting photo in WhatsApp after the message opens.",
      });
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">1-to-1 Meetings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log every networking meeting and share highlights with your community.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setCreateOpen(true); }}
          className="hidden sm:inline-flex"
        >
          <Plus className="h-4 w-4" /> Add Meeting
        </Button>
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
        <p className="text-center text-muted-foreground py-12">Loading meetings…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">No meetings yet</p>
          <p className="text-sm text-muted-foreground mb-4">Log your first 1-to-1 meeting with an RBN member.</p>
          <Button onClick={() => { setEditing(null); setCreateOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Meeting
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              otherMember={participants[m.meeting_with_user_id]}
              isOwner={m.meeting_by_user_id === userId}
              onView={() => setViewing(m)}
              onEdit={() => { setEditing(m); setCreateOpen(true); }}
              onDelete={() => setToDelete(m)}
              onShare={() => share(m)}
            />
          ))}
        </div>
      )}

      {/* Floating add on mobile */}
      <button
        onClick={() => { setEditing(null); setCreateOpen(true); }}
        className="sm:hidden fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg grid place-items-center hover:bg-primary/90 active:scale-95 transition"
        aria-label="Add meeting"
      >
        <Plus className="h-6 w-6" />
      </button>

      {userId && (
        <CreateMeetingDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          currentUserId={userId}
          existing={editing}
        />
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
              This will permanently remove this meeting log. This action cannot be undone.
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

export default function MeetingsPage() {
  return (
    <PendingApprovalGate featureName="1-to-1 Meetings">
      <MeetingsInner />
    </PendingApprovalGate>
  );
}