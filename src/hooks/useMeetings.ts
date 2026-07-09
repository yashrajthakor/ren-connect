import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  created_at: string;
  updated_at: string;
}

async function loadParticipants(ids: string[]) {
  const map: Record<string, MemberLite> = {};
  if (!ids.length) return map;
  const { data } = await (supabase as any).rpc("get_members_by_user_ids", { _user_ids: ids });
  (data || []).forEach((m: MemberLite) => (map[m.user_id] = m));
  return map;
}

export function useMyMeetings(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["meetings", "mine", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("one_to_one_meetings")
        .select("*")
        .eq("meeting_by_user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (data || []) as Meeting[];
      const ids = Array.from(new Set(list.flatMap((m) => [m.meeting_by_user_id, m.meeting_with_user_id])));
      const participants = await loadParticipants(ids);
      return { meetings: list, participants };
    },
  });
}

export function useAdminMeetings(enabled: boolean) {
  return useQuery({
    queryKey: ["meetings", "admin"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_all_meetings_for_admin");
      if (error) throw error;
      const list = (data || []) as Meeting[];
      const ids = Array.from(new Set(list.flatMap((m) => [m.meeting_by_user_id, m.meeting_with_user_id])));
      const participants = await loadParticipants(ids);
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
    }) => {
      const { data, error } = await (supabase as any)
        .from("one_to_one_meetings")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
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
    `🤝 RBN 1-to-1 Meeting Log\n\n` +
    `Meeting By:\n${by?.name || "Member"}\n\n` +
    `Meeting With:\n${wth?.name || "Member"}\n\n` +
    `Business Categories:\n${byCats} ↔ ${withCats}\n\n` +
    `Discussion Summary:\n${m.discussion_summary || "—"}\n\n` +
    `📅 Logged via RBN – Rajput Business Network`
  );
}