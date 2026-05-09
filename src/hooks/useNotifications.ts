import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "lead_received"
  | "lead_updated"
  | "business_closed"
  | "announcement"
  | "admin_update"
  | "new_application";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export function useNotifications(userId: string | null | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", userId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  const query = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as AppNotification[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).rpc("mark_notification_read", { _id: id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await (supabase as any).rpc("mark_all_notifications_read");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  const list = query.data ?? [];
  const unreadCount = list.filter((n) => !n.read_at).length;

  return { ...query, list, unreadCount, markRead, markAllRead };
}

export function useBroadcastAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      title: string;
      body: string;
      target_role: string;
      link?: string | null;
    }) => {
      const { data, error } = await (supabase as any).rpc("broadcast_announcement", {
        _title: vars.title,
        _body: vars.body,
        _target_role: vars.target_role,
        _link: vars.link ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useAnnouncements(enabled: boolean) {
  return useQuery({
    queryKey: ["announcements"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Array<{
        id: string;
        title: string;
        body: string;
        target_role: string;
        recipients_count: number;
        created_at: string;
      }>;
    },
  });
}
