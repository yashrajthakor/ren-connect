import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RosterMember } from "@/components/admin/ConvertToPaidMemberDialog";

/**
 * Full admin member roster (Visitors + Paid Members) — used to feed the
 * shared ConvertToPaidMemberDialog's Visitor/Invited-By search wherever it's
 * embedded (e.g. Valuable Members' "+ New Valuable Member" flow, which has
 * no Visitor data of its own since its own list is paid-members-only).
 */
export function useMembersRoster(enabled = true) {
  return useQuery({
    queryKey: ["members-roster"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_members_for_admin");
      if (error) throw error;
      return (data || []) as RosterMember[];
    },
    staleTime: 30_000,
  });
}
