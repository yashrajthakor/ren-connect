import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useMemberStatus } from "@/hooks/useMemberStatus";

/**
 * Shows a celebration toast the moment a pending user is approved in this session.
 */
export default function ApprovalToastListener() {
  const { status } = useMemberStatus();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (prev.current && prev.current !== "active" && status === "active") {
      toast.success("🎉 Profile approved!", {
        description: "You now have full access to all RBN features.",
        duration: 6000,
      });
    }
    prev.current = status;
  }, [status]);

  return null;
}