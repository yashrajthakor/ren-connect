import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MemberLite } from "@/hooks/useLeads";

export interface Meeting {
  id: string;
  meeting_by_user_id: string;
  meeting_by_categories: string[];
  meeting_with_user_id: string;
  meeting_with_categories: string[];
  meeting_photo_url: string | null;
  discussion_summary: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const FEED_QUERY_ROOT = "networking-feed";
const FEED_PAGE_SIZE = 9;

async function loadParticipants(ids: string[]) {
  const map: Record<string, MemberLite> = {};
  if (!ids.length) return map;
  const { data } = await (supabase as any).rpc("get_members_by_user_ids", { _user_ids: ids });
  (data || []).forEach((m: MemberLite) => (map[m.user_id] = m));
  return map;
}

function participantIdsOf(list: Meeting[]) {
  return Array.from(new Set(list.flatMap((m) => [m.meeting_by_user_id, m.meeting_with_user_id])));
}

interface FeedPage {
  meetings: Meeting[];
  participants: Record<string, MemberLite>;
  nextPage: number | undefined;
}

/**
 * The "All" Networking Feed tab: every published post community-wide, newest first,
 * paginated for infinite scroll.
 */
export function useNetworkingFeed() {
  const qc = useQueryClient();

  // Keep the community feed feeling alive: refresh when any post is published/updated/removed.
  useEffect(() => {
    const channel = supabase
      .channel("networking-feed-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "one_to_one_meetings" }, () => {
        qc.invalidateQueries({ queryKey: [FEED_QUERY_ROOT, "all"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useInfiniteQuery({
    queryKey: [FEED_QUERY_ROOT, "all"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const from = pageParam * FEED_PAGE_SIZE;
      const to = from + FEED_PAGE_SIZE - 1;
      const { data, error } = await (supabase as any)
        .from("one_to_one_meetings")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      const meetings = (data || []) as Meeting[];
      const participants = await loadParticipants(participantIdsOf(meetings));
      return { meetings, participants, nextPage: meetings.length === FEED_PAGE_SIZE ? pageParam + 1 : undefined };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

/**
 * The "My Posts" tab: networking logs created by the logged-in member — both
 * published and private — newest first, paginated for infinite scroll.
 */
export function useMyNetworkingLogs(userId: string | null | undefined) {
  return useInfiniteQuery({
    queryKey: [FEED_QUERY_ROOT, "mine", userId],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const from = pageParam * FEED_PAGE_SIZE;
      const to = from + FEED_PAGE_SIZE - 1;
      const { data, error } = await (supabase as any)
        .from("one_to_one_meetings")
        .select("*")
        .eq("meeting_by_user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      const meetings = (data || []) as Meeting[];
      const participants = await loadParticipants(participantIdsOf(meetings));
      return { meetings, participants, nextPage: meetings.length === FEED_PAGE_SIZE ? pageParam + 1 : undefined };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

/** Admin: every networking log across RBN, regardless of publish state. */
export function useAdminMeetings(enabled: boolean) {
  return useQuery({
    queryKey: [FEED_QUERY_ROOT, "admin"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_all_meetings_for_admin");
      if (error) throw error;
      const list = (data || []) as Meeting[];
      const participants = await loadParticipants(participantIdsOf(list));
      return { meetings: list, participants };
    },
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      meeting_by_user_id: string;
      meeting_by_categories: string[];
      meeting_with_user_id: string;
      meeting_with_categories: string[];
      meeting_photo_url: string | null;
      discussion_summary: string;
      is_published: boolean;
    }) => {
      const { data, error } = await (supabase as any)
        .from("one_to_one_meetings")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FEED_QUERY_ROOT] }),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Meeting> }) => {
      const { data, error } = await (supabase as any)
        .from("one_to_one_meetings")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FEED_QUERY_ROOT] }),
  });
}

/** Toggle a post's publish state — powers both member Publish/Unpublish and admin Hide/Unhide. */
export function useSetPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { data, error } = await (supabase as any)
        .from("one_to_one_meetings")
        .update({ is_published })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FEED_QUERY_ROOT] }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("one_to_one_meetings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FEED_QUERY_ROOT] }),
  });
}

export async function uploadMeetingPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("meeting-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("meeting-photos").getPublicUrl(path);
  return data.publicUrl;
}

export function buildWhatsappShareText(m: Meeting, participants: Record<string, MemberLite>) {
  const by = participants[m.meeting_by_user_id];
  const wth = participants[m.meeting_with_user_id];
  const byCats = (m.meeting_by_categories || []).join(", ") || "—";
  const withCats = (m.meeting_with_categories || []).join(", ") || "—";
  return (
    `🤝 RBN Networking Meeting\n\n` +
    `Meeting By: ${by?.name || "Member"}\n` +
    `Meeting With: ${wth?.name || "Member"}\n` +
    `Business Categories: ${byCats} ↔ ${withCats}\n` +
    `Discussion Summary: ${m.discussion_summary || "—"}\n\n` +
    `📅 Logged through RBN – Rajput Business Network`
  );
}

function openWhatsappTextOnly(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

/**
 * Attempts to share the meeting photo + text natively (Web Share API Level 2,
 * `navigator.share` with `files`). Returns:
 *  - "shared": the native share sheet was invoked successfully
 *  - "cancelled": the user opened the share sheet but dismissed it
 *  - "unsupported": native file sharing isn't available/possible here
 * Never throws — all failures resolve to "unsupported" so callers can fall back silently.
 */
async function tryNativeImageShare(text: string, photoUrl: string): Promise<"shared" | "cancelled" | "unsupported"> {
  try {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      return "unsupported";
    }

    const res = await fetch(photoUrl, { mode: "cors" });
    if (!res.ok) return "unsupported";
    const blob = await res.blob();
    const mime = blob.type || "image/jpeg";
    const ext = mime.split("/")[1]?.split("+")[0] || "jpg";
    const file = new File([blob], `meeting-photo.${ext}`, { type: mime });

    const shareData: ShareData & { files?: File[] } = {
      files: [file],
      text,
      title: "RBN Networking Meeting",
    };

    if (typeof navigator.canShare !== "function" || !navigator.canShare(shareData)) {
      return "unsupported";
    }

    await navigator.share(shareData);
    return "shared";
  } catch (err: any) {
    if (err?.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}

/**
 * Shares a networking meeting (photo + formatted summary) via WhatsApp.
 *
 * Flow:
 *  1. If a meeting photo exists, try native image sharing (Web Share API Level 2),
 *     which lets the user pick WhatsApp and sends the photo + text together.
 *  2. If the user completed or cancelled that native share, we're done.
 *  3. Otherwise (no photo, or image sharing isn't possible for any reason), fall
 *     back to opening a WhatsApp chat pre-filled with the text summary only.
 * No errors are ever surfaced to the user — failures fall through silently.
 */
export async function shareMeetingViaWhatsapp(m: Meeting, participants: Record<string, MemberLite>) {
  const text = buildWhatsappShareText(m, participants);

  if (m.meeting_photo_url) {
    const result = await tryNativeImageShare(text, m.meeting_photo_url);
    if (result === "shared" || result === "cancelled") return;
  }

  openWhatsappTextOnly(text);
}
