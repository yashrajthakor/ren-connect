import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { AlertTriangle, CameraOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { extractCheckinToken } from "@/lib/meetingCheckin";

const SCANNER_ELEMENT_ID = "member-meeting-qr-reader";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScanMeetingQrDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Scan Meeting QR</DialogTitle>
          <DialogDescription>Point your camera at the meeting's QR code to mark your attendance.</DialogDescription>
        </DialogHeader>
        {open && <Scanner onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Scanner({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [wrongCode, setWrongCode] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const instance = new Html5Qrcode(SCANNER_ELEMENT_ID);

    instance
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          aspectRatio: 1,
          qrbox: (w, h) => {
            const edge = Math.floor(Math.min(w, h) * 0.75);
            return { width: edge, height: edge };
          },
        },
        (decodedText) => {
          if (cancelled || handledRef.current) return;
          const token = extractCheckinToken(decodedText);
          if (!token) {
            setWrongCode(true);
            return;
          }
          handledRef.current = true;
          onDone();
          navigate(`/attend/${token}`);
        },
        () => {}
      )
      .then(() => !cancelled && setReady(true))
      .catch((err: any) => {
        if (!cancelled) setCameraError(err?.message || "Camera access is required to scan the meeting QR.");
      });

    return () => {
      cancelled = true;
      instance
        .stop()
        .then(() => instance.clear())
        .catch(() => {});
    };
  }, []);

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/90">
        <div id={SCANNER_ELEMENT_ID} className="h-full w-full" />
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/95 p-6 text-center text-muted-foreground">
            <CameraOff className="h-8 w-8" />
            <p className="text-sm">{cameraError}</p>
          </div>
        )}
        {!ready && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
      {wrongCode && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          That isn't a meeting QR. Scan the QR shown by the attendance desk.
        </p>
      )}
    </div>
  );
}
