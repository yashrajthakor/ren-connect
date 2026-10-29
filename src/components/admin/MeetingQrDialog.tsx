import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AlertTriangle, Copy, Download, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useMeetingCheckinToken,
  useRegenerateCheckinToken,
  type MeetingStatus,
} from "@/hooks/useAttendanceMeetings";
import { buildMeetingCheckinUrl } from "@/lib/meetingCheckin";
import { formatDateOrNA } from "@/lib/membershipStatus";
import { formatTimeOfDay } from "@/lib/attendanceFormat";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: {
    id: string;
    title: string;
    meeting_date: string;
    meeting_time: string;
    status: MeetingStatus;
  } | null;
}

const STATUS_NOTE: Record<MeetingStatus, string> = {
  upcoming: "Members can scan this QR once you Start Attendance for this meeting.",
  live: "Attendance is live — members can scan this QR now to mark themselves present.",
  completed: "Attendance is closed, so this QR no longer marks attendance.",
};

export default function MeetingQrDialog({ open, onOpenChange, meeting }: Props) {
  const { toast } = useToast();
  const { data: token, isLoading, isError, refetch } = useMeetingCheckinToken(meeting?.id, open);
  const regenerate = useRegenerateCheckinToken();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const checkinUrl = token ? buildMeetingCheckinUrl(token) : null;

  useEffect(() => {
    setDataUrl(null);
    if (!checkinUrl) return;
    let cancelled = false;
    QRCode.toDataURL(checkinUrl, { width: 640, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(null));
    return () => {
      cancelled = true;
    };
  }, [checkinUrl]);

  if (!meeting) return null;

  const fileName = `${meeting.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "meeting"}-${meeting.meeting_date}-qr.png`;

  const copyLink = async () => {
    if (!checkinUrl) return;
    try {
      await navigator.clipboard.writeText(checkinUrl);
      toast({ title: "Check-in link copied" });
    } catch {
      toast({ title: "Couldn't copy the link", variant: "destructive" });
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerate.mutateAsync(meeting.id);
      toast({ title: "New QR code generated", description: "The previous QR code no longer works." });
    } catch (e: any) {
      toast({ title: "Couldn't regenerate QR", description: e.message, variant: "destructive" });
    } finally {
      setConfirmRegenerate(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meeting Check-in QR</DialogTitle>
            <DialogDescription>
              {meeting.title} · {formatDateOrNA(meeting.meeting_date)} · {formatTimeOfDay(meeting.meeting_time)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center">
            {isError ? (
              <div className="aspect-square w-full max-w-[320px] flex flex-col items-center justify-center gap-2 text-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-muted-foreground">Couldn't load this meeting's QR code.</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            ) : isLoading || !dataUrl ? (
              <div className="aspect-square w-full max-w-[320px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <img
                src={dataUrl}
                alt={`Check-in QR for ${meeting.title}`}
                className="w-full max-w-[320px] rounded-xl border border-border bg-white"
              />
            )}
          </div>

          <p
            className={
              meeting.status === "live"
                ? "rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-xs font-medium text-emerald-700 dark:text-emerald-300"
                : "rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground"
            }
          >
            {STATUS_NOTE[meeting.status]}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {dataUrl ? (
              <Button asChild variant="royal">
                <a href={dataUrl} download={fileName}>
                  <Download className="h-4 w-4 mr-1.5" /> Download
                </a>
              </Button>
            ) : (
              <Button variant="royal" disabled>
                <Download className="h-4 w-4 mr-1.5" /> Download
              </Button>
            )}
            <Button variant="outline" onClick={copyLink} disabled={!checkinUrl}>
              <Copy className="h-4 w-4 mr-1.5" /> Copy Link
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setConfirmRegenerate(true)}
            disabled={!token || regenerate.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Generate a new QR code
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate a new QR code?</AlertDialogTitle>
            <AlertDialogDescription>
              The current QR code for "{meeting.title}" will stop working immediately — including any printed copy or
              photo already shared. Use this if the QR was shared with people who aren't at the meeting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerate.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} disabled={regenerate.isPending}>
              {regenerate.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Generate New QR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
