import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, Loader2, Search, UserPlus, Trash2, Star, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useAttendanceMeetings,
  useMeetingAttendance,
  useDeleteAttendance,
  useCloseMeetingAttendance,
  type MeetingAttendanceRow,
} from "@/hooks/useAttendanceMeetings";
import { formatDateOrNA } from "@/lib/membershipStatus";
import { formatTimeOfDay, formatCheckInTime, isBackdated } from "@/lib/attendanceFormat";
import ManualCheckInDialog from "@/components/admin/ManualCheckInDialog";

export default function AttendanceHistoryDetail() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: meetings = [] } = useAttendanceMeetings();
  const { data: rows = [], isLoading, isError, refetch } = useMeetingAttendance(meetingId);
  const deleteAttendance = useDeleteAttendance();
  const closeAttendance = useCloseMeetingAttendance();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [removingRow, setRemovingRow] = useState<MeetingAttendanceRow | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const meeting = meetings.find((m) => m.id === meetingId);
  const presentIds = new Set(rows.map((r) => r.member_id));
  const backdated = !!meeting && meeting.status !== "completed" && isBackdated(meeting.meeting_date);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.member_name?.toLowerCase().includes(q));
  }, [rows, search]);

  const handleRemove = async () => {
    if (!removingRow || !meetingId) return;
    try {
      await deleteAttendance.mutateAsync({ attendanceId: removingRow.attendance_id, meetingId });
      toast({ title: `${removingRow.member_name} removed from attendance` });
    } catch (e: any) {
      toast({ title: "Couldn't remove attendance", description: e.message, variant: "destructive" });
    } finally {
      setRemovingRow(null);
    }
  };

  const handleClose = async () => {
    if (!meetingId) return;
    setClosing(true);
    try {
      await closeAttendance.mutateAsync(meetingId);
      toast({ title: "Meeting marked Completed", description: "Attendance for this meeting is now finalized." });
    } catch (e: any) {
      toast({ title: "Couldn't complete meeting", description: e.message, variant: "destructive" });
    } finally {
      setClosing(false);
      setCloseConfirmOpen(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/admin/attendance/history")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Attendance History
      </Button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-foreground">{meeting?.title || "Meeting"}</h1>
            {backdated && (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                Backdated Attendance
              </span>
            )}
          </div>
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
        {meetingId && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Add Member
            </Button>
            {backdated && (
              <Button variant="royal" onClick={() => setCloseConfirmOpen(true)}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark as Completed
              </Button>
            )}
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
                  <TableHead>Attendance As</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.attendance_id}>
                    <TableCell className="font-medium">{r.member_name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.business_name || "Not Available"}</TableCell>
                    <TableCell>
                      {r.attendance_type === "valuable_member" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          <Star className="h-3 w-3 fill-primary" /> Valuable Member
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">Visitor</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatCheckInTime(r.check_in_time)}</TableCell>
                    <TableCell className="text-muted-foreground uppercase text-xs font-semibold">
                      {r.method}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setRemovingRow(r)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {meetingId && (
        <ManualCheckInDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          meetingId={meetingId}
          presentMemberIds={presentIds}
          mode="edit"
          onCheckedIn={() => refetch()}
        />
      )}

      <AlertDialog open={!!removingRow} onOpenChange={(o) => !o && setRemovingRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove attendance record?</AlertDialogTitle>
            <AlertDialogDescription>
              {removingRow && <>"{removingRow.member_name}" will no longer be marked present for this meeting.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark this meeting as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This finalizes attendance for "{meeting?.title}". The meeting's status will change from Upcoming to
              Completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={closing}>
              {closing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Mark as Completed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
