import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  CalendarDays,
  Clock,
  MapPin,
  Loader2,
  ScanLine,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  XCircle,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  useLiveMeeting,
  useMeetingAttendance,
  useMarkAttendance,
  useCloseMeetingAttendance,
} from "@/hooks/useAttendanceMeetings";
import { useValuableMembers } from "@/hooks/useValuableMembers";
import { formatDateOrNA } from "@/lib/membershipStatus";
import { formatTimeOfDay, formatCheckInTime } from "@/lib/attendanceFormat";
import ManualCheckInDialog from "@/components/admin/ManualCheckInDialog";

const SCANNER_ELEMENT_ID = "attendance-qr-reader";
const RESCAN_COOLDOWN_MS = 4000;
const FEEDBACK_DISMISS_MS = 2500;
const FLASH_DURATION_MS = 500;

type ScanFeedback = { type: "success" | "duplicate"; message: string };

export default function LiveAttendance() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: liveMeeting, isLoading: loadingMeeting } = useLiveMeeting();
  const { data: rows = [], refetch: refetchRows } = useMeetingAttendance(liveMeeting?.id, !!liveMeeting);
  const { data: valuableMembers = [] } = useValuableMembers(!!liveMeeting);
  const markAttendance = useMarkAttendance();
  const closeAttendance = useCloseMeetingAttendance();

  const [manualOpen, setManualOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const [scanFlash, setScanFlash] = useState<"success" | "duplicate" | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const meetingIdRef = useRef<string | undefined>(undefined);
  meetingIdRef.current = liveMeeting?.id;

  // Scan feedback (success/duplicate banner) auto-dismisses without any
  // manual action — the admin should be able to keep scanning hands-free.
  useEffect(() => {
    if (!scanFeedback) return;
    const timer = setTimeout(() => setScanFeedback(null), FEEDBACK_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [scanFeedback]);

  useEffect(() => {
    if (!scanFlash) return;
    const timer = setTimeout(() => setScanFlash(null), FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [scanFlash]);

  useEffect(() => {
    if (!liveMeeting) return;
    let cancelled = false;
    const instance = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = instance;

    instance
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          aspectRatio: 1,
          // Scale the square scan frame to the viewfinder itself so it stays
          // square and fills the frame on any screen size, instead of a
          // fixed pixel box that leaves empty space on larger viewports.
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75);
            return { width: edge, height: edge };
          },
        },
        async (decodedText) => {
          if (cancelled) return;
          const now = Date.now();
          if (
            lastScanRef.current &&
            lastScanRef.current.code === decodedText &&
            now - lastScanRef.current.at < RESCAN_COOLDOWN_MS
          ) {
            return;
          }
          if (processingRef.current) return;
          processingRef.current = true;
          lastScanRef.current = { code: decodedText, at: now };

          const meetingId = meetingIdRef.current;
          if (!meetingId) {
            processingRef.current = false;
            return;
          }

          try {
            const result = await markAttendance.mutateAsync({
              meetingId,
              memberId: decodedText.trim(),
              method: "qr",
            });
            if (result.duplicate) {
              setScanFlash("duplicate");
              setScanFeedback({
                type: "duplicate",
                message: `${result.member_name} has already checked in at ${formatCheckInTime(result.check_in_time)}.`,
              });
            } else {
              setScanFlash("success");
              setScanFeedback({ type: "success", message: `${result.member_name} checked in successfully.` });
            }
          } catch (e: any) {
            toast({ title: "Check-in failed", description: e.message, variant: "destructive" });
          } finally {
            processingRef.current = false;
          }
        },
        () => {
          // Continuous scan-frame failures are expected while no QR is in view — ignore.
        }
      )
      .then(() => {
        if (!cancelled) setScannerReady(true);
      })
      .catch((err: any) => {
        if (!cancelled) setCameraError(err?.message || "Camera access is required to scan QR codes.");
      });

    return () => {
      cancelled = true;
      const running = scannerRef.current;
      scannerRef.current = null;
      if (running) {
        running
          .stop()
          .then(() => running.clear())
          .catch(() => {});
      }
    };
  }, [liveMeeting?.id]);

  const presentIds = new Set(rows.map((r) => r.member_id));
  const totalValuable = valuableMembers.length;
  const totalPresent = rows.length;
  const remaining = Math.max(totalValuable - totalPresent, 0);

  const handleClose = async () => {
    if (!liveMeeting) return;
    setClosing(true);
    try {
      await closeAttendance.mutateAsync(liveMeeting.id);
      toast({ title: "Attendance closed", description: "This meeting is now marked Completed." });
      navigate("/admin/attendance/meetings");
    } catch (e: any) {
      toast({ title: "Couldn't close attendance", description: e.message, variant: "destructive" });
    } finally {
      setClosing(false);
      setCloseConfirmOpen(false);
    }
  };

  if (loadingMeeting) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading live attendance...
      </div>
    );
  }

  if (!liveMeeting) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ScanLine className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">No Live Meeting</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start attendance for an upcoming meeting to begin scanning check-ins here.
          </p>
          <Button variant="royal" className="mt-6" onClick={() => navigate("/admin/attendance/meetings")}>
            Go to Meetings
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-primary" /> {liveMeeting.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDateOrNA(liveMeeting.meeting_date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {formatTimeOfDay(liveMeeting.meeting_time)}
            </span>
            {liveMeeting.venue && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {liveMeeting.venue}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setManualOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Manual Check-in
          </Button>
          <Button variant="destructive" onClick={() => setCloseConfirmOpen(true)}>
            <XCircle className="h-4 w-4 mr-1.5" /> Close Attendance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={<Users className="h-4 w-4" />} label="Total Valuable Members" value={totalValuable} />
        <Stat icon={<UserCheck className="h-4 w-4" />} label="Members Present" value={totalPresent} />
        <Stat icon={<UserX className="h-4 w-4" />} label="Remaining Members" value={remaining} />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 p-4 flex flex-col items-center">
          <h2 className="text-sm font-semibold text-foreground self-start mb-3">QR Scanner</h2>

          <div className="w-full max-w-md min-h-[2.25rem] mb-2">
            {scanFeedback && (
              <div
                className={cn(
                  "w-full rounded-lg px-3.5 py-2 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200",
                  scanFeedback.type === "success"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                )}
              >
                {scanFeedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{scanFeedback.message}</span>
              </div>
            )}
          </div>

          <div
            className={cn(
              "w-full max-w-md aspect-square rounded-xl overflow-hidden bg-black/90 relative ring-4 transition-colors duration-200",
              scanFlash === "success"
                ? "ring-emerald-500"
                : scanFlash === "duplicate"
                  ? "ring-amber-500"
                  : "ring-transparent"
            )}
          >
            <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6 bg-background/95 text-muted-foreground">
                <CameraOff className="h-8 w-8" />
                <p className="text-sm">{cameraError}</p>
              </div>
            )}
            {!scannerReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center text-white/70">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Point the camera at a member's QR code to check them in automatically.
          </p>
        </Card>

        <Card className="lg:col-span-2 p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent Check-ins</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No check-ins yet.</p>
          ) : (
            <div className="space-y-1 max-h-[420px] overflow-y-auto">
              {rows.map((r) => (
                <div
                  key={r.attendance_id}
                  className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-muted/50"
                >
                  <span className="text-sm font-medium truncate">{r.member_name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatCheckInTime(r.check_in_time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ManualCheckInDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        meetingId={liveMeeting.id}
        presentMemberIds={presentIds}
        onCheckedIn={() => {
          refetchRows();
        }}
      />

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close attendance?</AlertDialogTitle>
            <AlertDialogDescription>
              This meeting will be marked Completed. QR scanning and Manual Check-in will stop, and no further
              attendance can be added.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={closing}>
              {closing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Close Attendance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
