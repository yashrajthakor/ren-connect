import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Loader2, MoreVertical, Plus, Pencil, Trash2, ScanLine, Eye, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useDeleteAttendanceMeeting,
  useStartMeetingAttendance,
  type AttendanceMeeting,
} from "@/hooks/useAttendanceMeetings";
import { MeetingStatusBadge } from "@/components/admin/MeetingStatusBadge";
import MeetingFormDialog from "@/components/admin/MeetingFormDialog";
import { formatDateOrNA } from "@/lib/membershipStatus";
import { formatTimeOfDay, isBackdated } from "@/lib/attendanceFormat";

export default function AttendanceMeetings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: meetings = [], isLoading, isError, refetch } = useAttendanceMeetings();
  const startAttendance = useStartMeetingAttendance();
  const deleteMeeting = useDeleteAttendanceMeeting();

  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<AttendanceMeeting | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<AttendanceMeeting | null>(null);

  const handleStart = async (m: AttendanceMeeting) => {
    try {
      await startAttendance.mutateAsync(m.id);
      navigate("/admin/attendance/live");
    } catch (e: any) {
      toast({ title: "Couldn't start attendance", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingMeeting) return;
    try {
      await deleteMeeting.mutateAsync(deletingMeeting.id);
      toast({ title: "Meeting deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeletingMeeting(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" /> Meetings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule meetings and manage attendance check-ins.
          </p>
        </div>
        <Button
          variant="royal"
          onClick={() => {
            setEditingMeeting(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" /> Create Meeting
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading meetings...
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-destructive text-sm mb-3">Couldn't load meetings.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No meetings scheduled yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Meeting Title</TableHead>
                  <TableHead>Meeting Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Start Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Total Present</TableHead>
                  <TableHead className="w-16 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.title}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{formatTimeOfDay(m.meeting_time)}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateOrNA(m.meeting_date)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatTimeOfDay(m.meeting_time)}
                    </TableCell>
                    <TableCell>
                      <MeetingStatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{m.total_present}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {m.status === "upcoming" && !isBackdated(m.meeting_date) && (
                            <DropdownMenuItem onClick={() => handleStart(m)}>
                              <ScanLine className="h-4 w-4 mr-2" /> Start Attendance
                            </DropdownMenuItem>
                          )}
                          {m.status === "upcoming" && isBackdated(m.meeting_date) && (
                            <DropdownMenuItem onClick={() => navigate(`/admin/attendance/history/${m.id}`)}>
                              <UserPlus className="h-4 w-4 mr-2" /> Add Attendance
                            </DropdownMenuItem>
                          )}
                          {m.status === "live" && (
                            <DropdownMenuItem onClick={() => navigate("/admin/attendance/live")}>
                              <ScanLine className="h-4 w-4 mr-2" /> Go to Live Attendance
                            </DropdownMenuItem>
                          )}
                          {m.status === "completed" && (
                            <DropdownMenuItem onClick={() => navigate(`/admin/attendance/history/${m.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View Attendance
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMeeting(m);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Edit Meeting
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingMeeting(m)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Meeting
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <MeetingFormDialog open={formOpen} onOpenChange={setFormOpen} meeting={editingMeeting} onSuccess={refetch} />

      <AlertDialog open={!!deletingMeeting} onOpenChange={(o) => !o && setDeletingMeeting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingMeeting && (
                <>
                  "{deletingMeeting.title}" and all of its attendance records will be permanently deleted. This
                  cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
