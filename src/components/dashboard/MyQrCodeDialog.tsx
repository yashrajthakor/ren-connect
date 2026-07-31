import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import MemberQrCodeCard from "@/components/shared/MemberQrCodeCard";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MyProfileLite {
  member_id: string;
  full_name: string | null;
}

/** Member Portal's "My QR Code" — reuses the same QR generation/display used in the Admin module. */
export default function MyQrCodeDialog({ open, onOpenChange }: Props) {
  const [profile, setProfile] = useState<MyProfileLite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (supabase as any).rpc("get_my_profile").then(({ data, error }: any) => {
      if (cancelled) return;
      if (!error && data) {
        setProfile({ member_id: data.member_id, full_name: data.full_name });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>My QR Code</DialogTitle>
          <DialogDescription>Show this at meeting check-in.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : profile ? (
          <MemberQrCodeCard memberId={profile.member_id} memberName={profile.full_name} className="p-0 border-0 shadow-none" />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-10">Couldn't load your QR code.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
