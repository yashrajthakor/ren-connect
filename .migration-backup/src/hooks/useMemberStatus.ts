import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";

export type MemberStatus = "active" | "under_review" | "pending" | "rejected" | "suspended" | null;

export const PENDING_STATUSES: MemberStatus[] = ["under_review", "pending"];

export function useMemberStatus() {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<MemberStatus>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_my_member_status");
      if (error) console.error("get_my_member_status error:", error);
      setStatus(((data as string) || null) as MemberStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: refresh when this member's row changes (e.g. admin approves)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`member-status-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "members", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const isPending = !!status && PENDING_STATUSES.includes(status);
  const isApproved = status === "active";
  const isRejected = status === "rejected";

  return { status, loading, isPending, isApproved, isRejected, refresh };
}