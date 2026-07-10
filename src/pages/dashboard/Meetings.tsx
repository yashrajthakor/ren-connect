import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Plus, Search, Rss, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PendingApprovalGate from "@/components/dashboard/PendingApprovalGate";
import { useCurrentUserId, type MemberLite } from "@/hooks/useLeads";
import {
  useNetworkingFeed, useMyNetworkingLogs, useDeleteMeeting, useSetPublished,
  shareMeetingViaWhatsapp, type Meeting,
} from "@/hooks/useMeetings";
import FeedCard, { type FeedCardVariant } from "@/components/meetings/MeetingCard";
import AddNetworkingLogDialog from "@/components/meetings/CreateMeetingDialog";
import FeedDetailDialog from "@/components/meetings/MeetingDetailDialog";
import { useToast } from "@/hooks/use-toast";

function flattenPages(data: { pages: Array<{ meetings: Meeting[]; participants: Record<string, MemberLite> }> } | undefined) {
  const pages = data?.pages ?? [];
  const meetings = pages.flatMap((p) => p.meetings);
  const participants = pages.reduce<Record<string, MemberLite>>((acc, p) => Object.assign(acc, p.participants), {});
  return { meetings, participants };
}

function filterMeetings(list: Meeting[], participants: Record<string, MemberLite>, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((m) => {
    const by = participants[m.meeting_by_user_id];
    const wth = participants[m.meeting_with_user_id];
    return (
      by?.name?.toLowerCase().includes(q) ||
      wth?.name?.toLowerCase().includes(q) ||
      by?.business?.toLowerCase().includes(q) ||
      wth?.business?.toLowerCase().includes(q) ||
      m.discussion_summary.toLowerCase().includes(q)
    );
  });
}

function useInfiniteSentinel(onIntersect: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onIntersect();
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, enabled]);
  return ref;
}

interface FeedGridProps {
  meetings: Meeting[];
  participants: Record<string, MemberLite>;
  variant: FeedCardVariant;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onView: (m: Meeting) => void;
  onEdit?: (m: Meeting) => void;
  onDelete?: (m: Meeting) => void;
  onShare: (m: Meeting) => void;
  onTogglePublish?: (m: Meeting) => void;
  togglingId?: string;
  emptyTitle: string;
  emptyDesc: string;
  onAdd: () => void;
}

function FeedGrid({
  meetings, participants, variant, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage,
  onView, onEdit, onDelete, onShare, onTogglePublish, togglingId, emptyTitle, emptyDesc, onAdd,
}: FeedGridProps) {
  const canLoadMore = hasNextPage && !isFetchingNextPage;
  const sentinelRef = useInfiniteSentinel(fetchNextPage, canLoadMore);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[26rem] rounded-xl" />
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
        <Rss className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium text-foreground mb-1">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground mb-4">{emptyDesc}</p>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add Networking Log
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetings.map((m) => (
          <FeedCard
            key={m.id}
            meeting={m}
            byMember={participants[m.meeting_by_user_id]}
            withMember={participants[m.meeting_with_user_id]}
            variant={variant}
            onView={() => onView(m)}
            onEdit={onEdit ? () => onEdit(m) : undefined}
            onDelete={onDelete ? () => onDelete(m) : undefined}
            onShare={() => onShare(m)}
            onTogglePublish={onTogglePublish ? () => onTogglePublish(m) : undefined}
            togglingPublish={togglingId === m.id}
          />
        ))}
      </div>
      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
      )}
    </>
  );
}

function MeetingsInner() {
  const { data: userId } = useCurrentUserId();
  const { toast } = useToast();

  const [tab, setTab] = useState<"all" | "mine">("all");
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [viewing, setViewing] = useState<Meeting | null>(null);
  const [viewingParticipants, setViewingParticipants] = useState<Record<string, MemberLite>>({});
  const [toDelete, setToDelete] = useState<Meeting | null>(null);

  const feedQuery = useNetworkingFeed();
  const mineQuery = useMyNetworkingLogs(userId);
  const deleteMut = useDeleteMeeting();
  const publishMut = useSetPublished();

  const feedData = useMemo(() => flattenPages(feedQuery.data), [feedQuery.data]);
  const mineData = useMemo(() => flattenPages(mineQuery.data), [mineQuery.data]);

  const feedFiltered = useMemo(() => filterMeetings(feedData.meetings, feedData.participants, q), [feedData, q]);
  const mineFiltered = useMemo(() => filterMeetings(mineData.meetings, mineData.participants, q), [mineData, q]);

  const openCreate = useCallback(() => { setEditing(null); setCreateOpen(true); }, []);
  const openEdit = useCallback((m: Meeting) => { setEditing(m); setCreateOpen(true); }, []);
  const openView = useCallback((m: Meeting, participants: Record<string, MemberLite>) => {
    setViewing(m);
    setViewingParticipants(participants);
  }, []);
  const share = useCallback((m: Meeting, participants: Record<string, MemberLite>) => {
    void shareMeetingViaWhatsapp(m, participants);
  }, []);

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

  const handleTogglePublish = async (m: Meeting) => {
    try {
      await publishMut.mutateAsync({ id: m.id, is_published: !m.is_published });
      toast({ title: m.is_published ? "Post unpublished" : "Published to 1:1 Feed" });
    } catch (e: any) {
      toast({ title: "Could not update", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Rss className="h-4.5 w-4.5 text-primary" />
              </span>
              1:1 Feed
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Log your networking meetings and share the highlights with the RBN community.
            </p>
          </div>
          <Button onClick={openCreate} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> Add Networking Log
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "mine")}>
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mine">My Posts</TabsTrigger>
            </TabsList>
            <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by member or discussion..."
                className="pl-9 h-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <TabsContent value="all" className="mt-0">
            <FeedGrid
              meetings={feedFiltered}
              participants={feedData.participants}
              variant="feed"
              isLoading={feedQuery.isLoading}
              hasNextPage={!!feedQuery.hasNextPage}
              isFetchingNextPage={feedQuery.isFetchingNextPage}
              fetchNextPage={() => feedQuery.fetchNextPage()}
              onView={(m) => openView(m, feedData.participants)}
              onShare={(m) => share(m, feedData.participants)}
              emptyTitle="No posts yet"
              emptyDesc="Be the first to share a networking meeting with the RBN community."
              onAdd={openCreate}
            />
          </TabsContent>
          <TabsContent value="mine" className="mt-0">
            <FeedGrid
              meetings={mineFiltered}
              participants={mineData.participants}
              variant="mine"
              isLoading={mineQuery.isLoading}
              hasNextPage={!!mineQuery.hasNextPage}
              isFetchingNextPage={mineQuery.isFetchingNextPage}
              fetchNextPage={() => mineQuery.fetchNextPage()}
              onView={(m) => openView(m, mineData.participants)}
              onEdit={openEdit}
              onDelete={(m) => setToDelete(m)}
              onShare={(m) => share(m, mineData.participants)}
              onTogglePublish={handleTogglePublish}
              togglingId={publishMut.isPending ? (publishMut.variables as { id: string } | undefined)?.id : undefined}
              emptyTitle="No networking logs yet"
              emptyDesc="Log your first networking meeting with an RBN member."
              onAdd={openCreate}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Floating add on mobile */}
      <button
        onClick={openCreate}
        className="sm:hidden fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg grid place-items-center hover:bg-primary/90 active:scale-95 transition"
        aria-label="Add networking log"
      >
        <Plus className="h-6 w-6" />
      </button>

      {userId && (
        <AddNetworkingLogDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          currentUserId={userId}
          existing={editing}
        />
      )}
      <FeedDetailDialog
        meeting={viewing}
        participants={viewingParticipants}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        onShare={(m) => share(m, viewingParticipants)}
        showStatus={!!viewing && viewing.meeting_by_user_id === userId}
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

export default function MeetingsPage() {
  return (
    <PendingApprovalGate featureName="1:1 Feed">
      <MeetingsInner />
    </PendingApprovalGate>
  );
}
