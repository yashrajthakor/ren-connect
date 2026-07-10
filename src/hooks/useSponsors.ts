import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SponsorRow {
  id: string;
  logo_url: string;
  firm_name: string;
  owner_name: string;
  tagline: string;
  website: string | null;
  sponsorship_type: string;
  contact_number: string | null;
  display_order: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  logo: string;
  firmName: string;
  ownerName: string;
  tagline: string;
  website?: string;
  sponsorshipType: string;
  contactNumber?: string;
}

export function mapSponsorRow(row: SponsorRow): Sponsor {
  return {
    id: row.id,
    logo: row.logo_url,
    firmName: row.firm_name,
    ownerName: row.owner_name,
    tagline: row.tagline,
    website: row.website ?? undefined,
    sponsorshipType: row.sponsorship_type ?? "",
    contactNumber: row.contact_number ?? undefined,
  };
}

/** Pick a fitting medal/emoji for a sponsorship category badge. */
export function sponsorTypeEmoji(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("title")) return "🏆";
  if (t.includes("gold")) return "🥇";
  if (t.includes("silver")) return "🥈";
  if (t.includes("event")) return "🎯";
  if (t.includes("tech")) return "💻";
  if (t.includes("partner")) return "🤝";
  if (t.includes("venue")) return "📍";
  if (t.includes("lunch") || t.includes("dinner") || t.includes("food")) return "🍽️";
  if (t.includes("tea") || t.includes("coffee")) return "☕";
  if (t.includes("pen")) return "🖊️";
  return "🏅";
}

export function useActiveSponsors() {
  return useQuery({
    queryKey: ["sponsors", "active"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sponsors")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data || []) as SponsorRow[]).map(mapSponsorRow);
    },
    staleTime: 60_000,
  });
}

export function useAllSponsors(enabled: boolean) {
  return useQuery({
    queryKey: ["sponsors", "all"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sponsors")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as SponsorRow[];
    },
  });
}

export type SponsorInput = {
  logo_url: string;
  firm_name: string;
  owner_name: string;
  tagline: string;
  website: string | null;
  sponsorship_type: string;
  contact_number: string | null;
  display_order: number;
  is_active: boolean;
};

export function useSponsorMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["sponsors"] });

  const create = useMutation({
    mutationFn: async (input: SponsorInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from("sponsors")
        .insert({ ...input, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as SponsorRow;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SponsorInput> }) => {
      const { data, error } = await (supabase as any)
        .from("sponsors")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as SponsorRow;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("sponsors").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
