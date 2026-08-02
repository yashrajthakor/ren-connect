import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarCheck2, Loader2, CheckCircle2, XCircle, CalendarDays, Star, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useValuableMembers } from "@/hooks/useValuableMembers";
import { useMemberAttendanceHistory } from "@/hooks/useAttendanceMeetings";
import { formatDateOrNA } from "@/lib/membershipStatus";
import { MeetingTypeBadge } from "@/components/admin/MeetingTypeBadge";
import { DEFAULT_MEETING_TYPE } from "@/lib/meetingType";

export default function ValuableMemberAttendance() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { data: members = [], isLoading: loadingMember } = useValuableMembers();
  const { data: history = [], isLoading: loadingHistory } = useMemberAttendanceHistory(memberId);
  const member = members.find((m) => m.member_id === memberId);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const isLoading = loadingMember || loadingHistory;

  const stats = useMemo(() => {
    const attended = history.filter((h) => h.present);
    const regularAttended = attended.filter((h) => (h.meeting_type || DEFAULT_MEETING_TYPE) === DEFAULT_MEETING_TYPE);
    return {
      total: history.length,
      attended: attended.length,
      regular: regularAttended.length,
      other: attended.length - regularAttended.length,
    };
  }, [history]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => set.add(h.meeting_type || DEFAULT_MEETING_TYPE));
    return Array.from(set).sort((a, b) => {
      if (a === DEFAULT_MEETING_TYPE) return -1;
      if (b === DEFAULT_MEETING_TYPE) return 1;
      return a.localeCompare(b);
    });
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (typeFilter === "all") return history;
    return history.filter((h) => (h.meeting_type || DEFAULT_MEETING_TYPE) === typeFilter);
  }, [history, typeFilter]);

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

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat icon={<CalendarDays className="h-4 w-4" />} label="Total Meetings" value={stats.total} />
        <Stat icon={<CalendarCheck2 className="h-4 w-4" />} label="Meetings Attended" value={stats.attended} />
        <Stat icon={<Star className="h-4 w-4" />} label="Regular Meetings Attended" value={stats.regular} />
        <Stat icon={<ListChecks className="h-4 w-4" />} label="Other Meetings Attended" value={stats.other} />
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-foreground">Attendance History</h2>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[190px] text-sm">
            <SelectValue placeholder="Meeting Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading attendance history...
          </div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No completed meetings yet.</div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            No attendance records found for the selected meeting type.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredHistory.map((h) => (
              <div key={h.meeting_id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{formatDateOrNA(h.meeting_date)}</p>
                  <MeetingTypeBadge type={h.meeting_type} className="mt-1" />
                  <p className="text-xs text-muted-foreground truncate mt-1">{h.title}</p>
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

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="text-xl font-display font-bold text-foreground mt-1">{value}</p>
    </Card>
  );
}
