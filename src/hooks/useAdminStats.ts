import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  count: number;
}

export interface BusinessGiverEntry {
  user_id: string;
  name: string;
  amount: number;
}

export interface AdminDashboardStats {
  meetings_total: number;
  meetings_leaderboard: LeaderboardEntry[];
  referrals_total: number;
  top_referral_givers: LeaderboardEntry[];
  business_generated: number;
  top_givers: BusinessGiverEntry[];
  new_paid_members: number;
  total_paid_members: number;
  new_registrations: number;
}

/** `start` inclusive, `end` exclusive. */
export function useAdminDashboardStats(start: Date, end: Date) {
  return useQuery({
    queryKey: ["admin-dashboard-stats", start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_admin_dashboard_stats", {
        _start: start.toISOString(),
        _end: end.toISOString(),
      });
      if (error) throw error;
      return (data || {}) as AdminDashboardStats;
    },
    staleTime: 60_000,
  });
}
