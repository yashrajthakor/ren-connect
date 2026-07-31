import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateAttendanceMeeting,
  useUpdateAttendanceMeeting,
  type AttendanceMeeting,
} from "@/hooks/useAttendanceMeetings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: AttendanceMeeting | null;
  onSuccess?: () => void;
}

export default function MeetingFormDialog({ open, onOpenChange, meeting, onSuccess }: Props) {
  const { toast } = useToast();
  const createMeeting = useCreateAttendanceMeeting();
  const updateMeeting = useUpdateAttendanceMeeting();
  const saving = createMeeting.isPending || updateMeeting.isPending;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(meeting?.title || "");
    setDate(meeting?.meeting_date || "");
    setTime(meeting?.meeting_time?.slice(0, 5) || "");
    setVenue(meeting?.venue || "");
    setDescription(meeting?.description || "");
  }, [open, meeting]);

  const valid = title.trim().length > 0 && date.length > 0 && time.length > 0;

  const save = async () => {
    if (!valid) return;
    try {
      if (meeting) {
        await updateMeeting.mutateAsync({
          id: meeting.id,
          title: title.trim(),
          meeting_date: date,
          meeting_time: time,
          venue: venue.trim() || null,
          description: description.trim() || null,
        });
        toast({ title: "Meeting updated" });
      } else {
        await createMeeting.mutateAsync({
          title: title.trim(),
          meeting_date: date,
          meeting_time: time,
          venue: venue.trim() || null,
          description: description.trim() || null,
        });
        toast({ title: "Meeting created" });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{meeting ? "Edit Meeting" : "Create Meeting"}</DialogTitle>
          <DialogDescription>
            {meeting ? "Update the meeting details below." : "Schedule a new meeting for attendance tracking."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Meeting Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Chapter Meet" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Meeting Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Start Time *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Venue</Label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="royal" onClick={save} disabled={saving || !valid}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
