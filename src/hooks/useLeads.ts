import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export type LeadStatus = "pending" | "in_process" | "business_closed" | "rejected";
export type LeadPriority = "low" | "medium" | "high";

export interface Lead {
  id: string;
  giver_id: string;
  receiver_id: string;
  lead_name: string;
  contact_number: string;
  description: string | null;
  priority: LeadPriority;
  status: LeadStatus;
  rejection_reason: string | null;
  closure_amount: number | null;
  closure_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberLite {
  user_id: string;
  name: string;
  business: string | null;
  avatar_url: string | null;
  city: string | null;
}

export interface LeadHistory {
  id: string;
  lead_id: string;
  changed_by: string | null;
  from_status: LeadStatus | null;
  to_status: LeadStatus;
  note: string | null;
  created_at: string;
}

export function useCurrentUserId() {
  return useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

async function loadParticipants(ids: string[]) {
  const participants: Record<string, MemberLite> = {};
  if (!ids.length) return participants;
  const { data } = await (supabase as any).rpc("get_members_by_user_ids", {
    _user_ids: ids,
  });
  (data || []).forEach((m: MemberLite) => (participants[m.user_id] = m));
  return participants;
}

export function useLeads(userId: string | null | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`leads-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        qc.invalidateQueries({ queryKey: ["leads"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return useQuery({
    queryKey: ["leads", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: leads, error } = await (supabase as any)
        .from("leads")
        .select("*")
        .or(`giver_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (leads || []) as Lead[];
      const ids = Array.from(
        new Set(list.flatMap((l) => [l.giver_id, l.receiver_id]).filter(Boolean))
      ) as string[];
      const participants = await loadParticipants(ids);
      return { leads: list, participants };
    },
  });
}

export function useActiveMembers() {
  return useQuery({
    queryKey: ["active-members-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_active_members_for_leads");
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        user_id: string;
        name: string;
        business: string | null;
        category: string | null;
        city: string | null;
        avatar_url: string | null;
        committee_badge: string | null;
      }>;
    },
  });
}

export function useLeadHistory(leadId: string | null) {
  return useQuery({
    queryKey: ["lead-history", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lead_status_history")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as LeadHistory[];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      giver_id: string;
      receiver_id: string;
      lead_name: string;
      contact_number: string;
      description?: string;
      priority: LeadPriority;
    }) => {
      const { error, data } = await (supabase as any)
        .from("leads")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Lead> }) => {
      const { error, data } = await (supabase as any)
        .from("leads")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-history", vars.id] });
    },
  });
}

export function useAdminLeads(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-leads"],
    enabled,
    queryFn: async () => {
      const { data: leads, error } = await (supabase as any)
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (leads || []) as Lead[];
      const ids = Array.from(
        new Set(list.flatMap((l) => [l.giver_id, l.receiver_id]).filter(Boolean))
      ) as string[];
      const participants = await loadParticipants(ids);
      return { leads: list, participants };
    },
  });
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  pending: "Pending",
  in_process: "In Process",
  business_closed: "Business Closed",
  rejected: "Rejected",
};

export const PRIORITY_LABEL: Record<LeadPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
