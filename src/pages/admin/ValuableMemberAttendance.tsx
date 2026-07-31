import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarCheck2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useValuableMembers } from "@/hooks/useValuableMembers";
import { useMemberAttendanceHistory } from "@/hooks/useAttendanceMeetings";
import { formatDateOrNA } from "@/lib/membershipStatus";

export default function ValuableMemberAttendance() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { data: members = [], isLoading: loadingMember } = useValuableMembers();
  const { data: history = [], isLoading: loadingHistory } = useMemberAttendanceHistory(memberId);
  const member = members.find((m) => m.member_id === memberId);

  const attendedCount = history.filter((h) => h.present).length;
  const isLoading = loadingMember || loadingHistory;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/admin/valuable-members")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Valuable Members
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </span>
          ) : (
            member?.full_name || "Member"
          )}
        </p>
      </div>

      <Card className="p-5 mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <CalendarCheck2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Attendance</p>
          <p className="text-lg font-display font-bold text-foreground">{attendedCount} Meetings Attended</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Attendance History</h2>
        </div>
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading attendance history...
          </div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            No completed meetings yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((h) => (
              <div key={h.meeting_id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{formatDateOrNA(h.meeting_date)}</p>
                  <p className="text-xs text-muted-foreground truncate">{h.title}</p>
                </div>
                {h.present ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" /> Present
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0">
                    <XCircle className="h-4 w-4" /> Absent
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
