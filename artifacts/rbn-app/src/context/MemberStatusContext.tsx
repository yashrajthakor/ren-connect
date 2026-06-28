import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";

export type MemberStatus = "active" | "under_review" | "pending" | "rejected" | "suspended" | null;

export const PENDING_STATUSES: MemberStatus[] = ["under_review", "pending"];

interface MemberStatusValue {
  status: MemberStatus;
  loading: boolean;
  isPending: boolean;
  isApproved: boolean;
  isRejected: boolean;
  refresh: () => Promise<void>;
}

const MemberStatusContext = createContext<MemberStatusValue | null>(null);

export function MemberStatusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<MemberStatus>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Single realtime subscription, torn down and rebuilt only when user changes.
  // Using a ref to hold the channel prevents multiple subscriptions from multiple consumers.
  useEffect(() => {
    if (!user) return;

    // Tear down any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `member-status-${user.id}-${Math.random().toString(36).slice(2)}`;
    let mounted = true;

    try {
      const ch = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "members", filter: `user_id=eq.${user.id}` },
          () => {
            if (mounted) refresh();
          }
        )
        .subscribe();
      channelRef.current = ch;
    } catch (err) {
      console.warn("Realtime member-status subscription failed:", err);
    }

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPending = !!status && PENDING_STATUSES.includes(status);
  const isApproved = status === "active";
  const isRejected = status === "rejected";

  return (
    <MemberStatusContext.Provider value={{ status, loading, isPending, isApproved, isRejected, refresh }}>
      {children}
    </MemberStatusContext.Provider>
  );
}

export function useMemberStatus(): MemberStatusValue {
  const ctx = useContext(MemberStatusContext);
  if (!ctx) throw new Error("useMemberStatus must be used within <MemberStatusProvider>");
  return ctx;
}
