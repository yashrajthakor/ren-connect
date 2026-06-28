import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AskStatus = "open" | "in_progress" | "resolved" | "closed";
export type AskPriority = "low" | "medium" | "high";

export interface Ask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string | null;
  city: string | null;
  priority: AskPriority;
  contact_details: string | null;
  status: AskStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface AskHistory {
  id: string;
  ask_id: string;
  changed_by: string | null;
  from_status: AskStatus | null;
  to_status: AskStatus;
  note: string | null;
  created_at: string;
}

export interface MemberLite {
  user_id: string;
  name: string;
  business: string | null;
  avatar_url: string | null;
  city: string | null;
}

async function loadParticipants(ids: string[]) {
  const map: Record<string, MemberLite> = {};
  if (!ids.length) return map;
  const { data } = await (supabase as any).rpc("get_members_by_user_ids", { _user_ids: ids });
  (data || []).forEach((m: MemberLite) => (map[m.user_id] = m));
  return map;
}

export function useAsks(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel("asks-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "asks" }, () =>
        qc.invalidateQueries({ queryKey: ["asks"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [enabled, qc]);

  return useQuery({
    queryKey: ["asks"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("asks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (data || []) as Ask[];
      const ids = Array.from(new Set(list.map((a) => a.user_id))) as string[];
      const participants = await loadParticipants(ids);
      return { asks: list, participants };
    },
  });
}

export function useCreateAsk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      user_id: string;
      title: string;
      description: string;
      category?: string | null;
      city?: string | null;
      priority: AskPriority;
      contact_details?: string | null;
    }) => {
      const { data, error } = await (supabase as any).from("asks").insert(payload).select().single();
      if (error) throw error;
      return data as Ask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asks"] }),
  });
}

export function useUpdateAsk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Ask> }) => {
      const { data, error } = await (supabase as any).from("asks").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as Ask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asks"] }),
  });
}

export function useDeleteAsk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("asks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asks"] }),
  });
}

export function useAskHistory(askId: string | null) {
  return useQuery({
    queryKey: ["ask-history", askId],
    enabled: !!askId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ask_status_history")
        .select("*")
        .eq("ask_id", askId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as AskHistory[];
    },
  });
}

export const ASK_STATUS_LABEL: Record<AskStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const ASK_PRIORITY_LABEL: Record<AskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
