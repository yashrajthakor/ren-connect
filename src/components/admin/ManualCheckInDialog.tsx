import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useValuableMembers } from "@/hooks/useValuableMembers";
import { useMarkAttendance, useAdminAddAttendance } from "@/hooks/useAttendanceMeetings";
import { useToast } from "@/hooks/use-toast";
import { nowForDatetimeLocalInput } from "@/lib/attendanceFormat";

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  presentMemberIds: Set<string>;
  onCheckedIn?: (memberName: string) => void;
  /** "live" (default) uses the live-scan check-in path, gated to a Live meeting.
   * "edit" uses the admin correction path, which works regardless of meeting status. */
  mode?: "live" | "edit";
}

export default function ManualCheckInDialog({
  open,
  onOpenChange,
  meetingId,
  presentMemberIds,
  onCheckedIn,
  mode = "live",
}: Props) {
  const { toast } = useToast();
  const { data: members = [], isLoading } = useValuableMembers(open);
  const markAttendance = useMarkAttendance();
  const adminAddAttendance = useAdminAddAttendance();
  const [search, setSearch] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState("");

  useEffect(() => {
    if (open && mode === "edit") setCheckInTime(nowForDatetimeLocalInput());
  }, [open, mode]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        (m.business_name || "").toLowerCase().includes(q) ||
        (m.phone || "").toLowerCase().includes(q)
    );
  }, [members, search]);

  const markPresent = async (memberId: string, memberName: string) => {
    setMarkingId(memberId);
    try {
      const result =
        mode === "edit"
          ? await adminAddAttendance.mutateAsync({
              meetingId,
              memberId,
              checkInTime: checkInTime ? new Date(checkInTime).toISOString() : null,
            })
          : await markAttendance.mutateAsync({ meetingId, memberId, method: "manual" });
      if (result.duplicate) {
        toast({ title: `${memberName} is already checked in.` });
      } else {
        toast({ title: `✅ ${memberName} checked in successfully.` });
        onCheckedIn?.(memberName);
      }
    } catch (e: any) {
      toast({ title: "Check-in failed", description: e.message, variant: "destructive" });
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manual Check-in</DialogTitle>
          <DialogDescription>Search a Valuable Member by name, business, or mobile number.</DialogDescription>
        </DialogHeader>

        {mode === "edit" && (
          <div>
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" /> Check-in Time
            </Label>
            <Input
              type="datetime-local"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, business, or mobile"
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto -mx-1 px-1 space-y-1">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading members...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No Valuable Members found.</div>
          ) : (
            filtered.map((m) => {
              const isPresent = presentMemberIds.has(m.member_id);
              return (
                <div
                  key={m.member_id}
                  className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-muted/50"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={m.profile_picture ?? undefined} />
                    <AvatarFallback className="text-xs">{initials(m.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{m.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.business_name || "Not Available"} · {m.phone || "Not Available"}
                    </div>
                  </div>
                  {isPresent ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-4 w-4" /> Present
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="royal"
                      className="shrink-0"
                      disabled={markingId === m.member_id}
                      onClick={() => markPresent(m.member_id, m.full_name)}
                    >
                      {markingId === m.member_id && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                      Mark Present
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
