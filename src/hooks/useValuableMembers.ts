import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ValuableMember {
  member_id: string;
  /** auth.users.id — null if this member has no linked auth account. Leads
   * (giver_id/receiver_id) and 1:1 Feed logs (meeting_by/with_user_id) are
   * keyed on this, not on member_id. */
  user_id: string | null;
  full_name: string;
  business_name: string | null;
  phone: string | null;
  profile_picture: string | null;
  status: string | null;
  membership_type: string | null;
  paid_joining_date: string | null;
  paid_valid_through: string | null;
  invited_by_member_id: string | null;
  invited_by_name: string | null;
  categories: string[] | null;
}

/**
 * Valuable Members = existing members filtered to Membership Type = Paid
 * Member. Backed by its own read-only RPC so this module never touches the
 * Members page's data path.
 */
export function useValuableMembers(enabled = true) {
  return useQuery({
    queryKey: ["valuable-members"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_valuable_members_for_admin");
      if (error) throw error;
      return (data || []) as ValuableMember[];
    },
    staleTime: 30_000,
  });
}
