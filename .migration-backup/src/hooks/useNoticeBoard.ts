import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NoticeCategory =
  | "meeting"
  | "event"
  | "announcement"
  | "reminder"
  | "alert"
  | "community_update";

export type NoticePriority = "high" | "medium" | "normal";

export interface Notice {
  id: string;
  title: string;
  description: string;
  category: NoticeCategory;
  priority: NoticePriority;
  is_pinned: boolean;
  is_active: boolean;
  publish_date: string;
  expiry_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const NOTICE_CATEGORY_LABEL: Record<NoticeCategory, string> = {
  meeting: "Meeting",
  event: "Event",
  announcement: "Announcement",
  reminder: "Reminder",
  alert: "Alert",
  community_update: "Community Update",
};

export const NOTICE_CATEGORY_EMOJI: Record<NoticeCategory, string> = {
  meeting: "📅",
  event: "🎉",
  announcement: "📢",
  reminder: "⏰",
  alert: "🚨",
  community_update: "🌟",
};

export const NOTICE_PRIORITY_LABEL: Record<NoticePriority, string> = {
  high: "High",
  medium: "Medium",
  normal: "Normal",
};

function sortNotices(rows: Notice[]): Notice[] {
  const priorityRank: Record<NoticePriority, number> = { high: 0, medium: 1, normal: 2 };
  return [...rows].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }
    return new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime();
  });
}

// Public: active, currently-published, non-expired notices
export function useActiveNotices() {
  return useQuery({
    queryKey: ["notice_board", "active"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await (supabase as any)
        .from("notice_board")
        .select("*")
        .eq("is_active", true)
        .lte("publish_date", nowIso)
        .or(`expiry_date.is.null,expiry_date.gt.${nowIso}`)
        .order("publish_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return sortNotices((data || []) as Notice[]);
    },
    staleTime: 60_000,
  });
}

// Admin: all notices
export function useAllNotices(enabled: boolean) {
  return useQuery({
    queryKey: ["notice_board", "all"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notice_board")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return sortNotices((data || []) as Notice[]);
    },
  });
}

export type NoticeInput = {
  title: string;
  description: string;
  category: NoticeCategory;
  priority: NoticePriority;
  is_pinned: boolean;
  is_active: boolean;
  publish_date: string;
  expiry_date: string | null;
};

export function useNoticeMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["notice_board"] });
  };

  const create = useMutation({
    mutationFn: async (input: NoticeInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from("notice_board")
        .insert({ ...input, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as Notice;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<NoticeInput> }) => {
      const { data, error } = await (supabase as any)
        .from("notice_board")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Notice;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("notice_board").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}