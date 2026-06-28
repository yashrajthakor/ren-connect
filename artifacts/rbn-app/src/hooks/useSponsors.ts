import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Sponsor {
  id: string;
  sponsor_name: string;
  firm_name: string;
  business_category: string;
  logo_url: string | null;
  contact_number: string;
  website: string | null;
  tagline: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type SponsorInput = Omit<Sponsor, "id" | "created_at" | "updated_at">;

const TABLE = "sponsors";

export function useSponsors() {
  return useQuery({
    queryKey: ["sponsors", "active"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as Sponsor[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAllSponsors(enabled: boolean) {
  return useQuery({
    queryKey: ["sponsors", "all"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as Sponsor[];
    },
  });
}

export function useCreateSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SponsorInput) => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Sponsor;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });
}

export function useUpdateSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SponsorInput> }) => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Sponsor;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });
}

export function useDeleteSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsors"] });
    },
  });
}
