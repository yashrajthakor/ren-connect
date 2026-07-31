import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAttendanceMeetings, useMeetingAttendance } from "@/hooks/useAttendanceMeetings";
import { formatDateOrNA } from "@/lib/membershipStatus";
import { formatTimeOfDay, formatCheckInTime } from "@/lib/attendanceFormat";

export default function AttendanceHistoryDetail() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { data: meetings = [] } = useAttendanceMeetings();
  const { data: rows = [], isLoading, isError, refetch } = useMeetingAttendance(meetingId);
  const [search, setSearch] = useState("");

  const meeting = meetings.find((m) => m.id === meetingId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.member_name?.toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/admin/attendance/history")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Attendance History
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">{meeting?.title || "Meeting"}</h1>
        {meeting && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDateOrNA(meeting.meeting_date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {formatTimeOfDay(meeting.meeting_time)}
            </span>
          </div>
        )}
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by member name"
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading attendance...
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-destructive text-sm mb-3">Couldn't load attendance.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No attendance records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.attendance_id}>
                    <TableCell className="font-medium">{r.member_name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.business_name || "Not Available"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatCheckInTime(r.check_in_time)}</TableCell>
                    <TableCell className="text-muted-foreground uppercase text-xs font-semibold">
                      {r.method}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
