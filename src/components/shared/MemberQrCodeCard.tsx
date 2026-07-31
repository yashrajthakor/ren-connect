import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Loader2, QrCode as QrCodeIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  memberId: string;
  memberName?: string | null;
  className?: string;
}

/**
 * Single source of QR generation/display/download for a member's permanent
 * check-in QR (encodes just the member UUID). Reused by the Admin Valuable
 * Member QR page and the Member Portal's "My QR Code" dialog — do not
 * duplicate this logic elsewhere.
 */
export default function MemberQrCodeCard({ memberId, memberName, className }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setDataUrl(null);
    let cancelled = false;
    QRCode.toDataURL(memberId, { width: 320, margin: 2 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return (
    <Card className={cn("p-8 text-center", className)}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <QrCodeIcon className="h-6 w-6 text-primary" />
      </div>
      <h1 className="font-display text-xl font-bold text-foreground">{memberName || "Member"}</h1>
      <p className="text-sm text-muted-foreground mt-1">Permanent QR code for meeting attendance check-in.</p>

      <div className="mt-6 flex justify-center">
        {dataUrl ? (
          <img src={dataUrl} alt="Member QR code" className="rounded-xl border border-border" />
        ) : (
          <div className="h-[320px] w-[320px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {dataUrl && (
        <a href={dataUrl} download={`${(memberName || "member").replace(/\s+/g, "-")}-qr.png`}>
          <Button variant="outline" className="mt-6">
            <Download className="h-4 w-4 mr-2" /> Download QR Code
          </Button>
        </a>
      )}
    </Card>
  );
}
