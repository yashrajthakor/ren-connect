import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History, Loader2, Search, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAttendanceMeetings } from "@/hooks/useAttendanceMeetings";
import { formatDateOrNA } from "@/lib/membershipStatus";
import { formatTimeOfDay } from "@/lib/attendanceFormat";

export default function AttendanceHistoryList() {
  const navigate = useNavigate();
  const { data: meetings = [], isLoading, isError, refetch } = useAttendanceMeetings();
  const [search, setSearch] = useState("");

  const completed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return meetings
      .filter((m) => m.status === "completed")
      .filter((m) => !q || m.title.toLowerCase().includes(q));
  }, [meetings, search]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" /> Attendance History
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Select a completed meeting to view its attendance.</p>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by meeting title"
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden divide-y divide-border">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading meetings...
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-destructive text-sm mb-3">Couldn't load meetings.</p>
            <button className="text-sm underline" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : completed.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No completed meetings yet.</div>
        ) : (
          completed.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/admin/attendance/history/${m.id}`)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">{m.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDateOrNA(m.meeting_date)} · {formatTimeOfDay(m.meeting_time)} · {m.total_present} present
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </Card>
    </div>
  );
}
