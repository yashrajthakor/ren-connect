import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUpdateLead, type Lead, type LeadStatus } from "@/hooks/useLeads";

type Mode = "in_process" | "business_closed" | "rejected";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: Lead | null;
  mode: Mode;
}

const titles: Record<Mode, string> = {
  in_process: "Mark as In Process",
  business_closed: "Mark Business Closed",
  rejected: "Reject Lead",
};

export default function UpdateStatusDialog({ open, onOpenChange, lead, mode }: Props) {
  const update = useUpdateLead();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [closureDate, setClosureDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setClosureDate(new Date().toISOString().slice(0, 10));
      setReason("");
    }
  }, [open]);

  if (!lead) return null;

  const onSubmit = async () => {
    try {
      const patch: Partial<Lead> = { status: mode as LeadStatus };
      if (mode === "business_closed") {
        const amt = Number(amount);
        if (!amt || amt <= 0 || amt > 1e10) {
          toast({ title: "Enter a valid amount", variant: "destructive" });
          return;
        }
        patch.closure_amount = amt;
        patch.closure_date = new Date(closureDate).toISOString();
      }
      if (mode === "rejected") {
        if (reason.trim().length < 5) {
          toast({ title: "Add a rejection reason (min 5 chars)", variant: "destructive" });
          return;
        }
        patch.rejection_reason = reason.trim();
      }
      await update.mutateAsync({ id: lead.id, patch });
      toast({ title: "Lead updated" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>
          <DialogDescription>{lead.lead_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "business_closed" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amt">Closing amount (₹)</Label>
                <Input
                  id="amt"
                  type="number"
                  min="1"
                  inputMode="decimal"
                  placeholder="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dt">Closure date</Label>
                <Input
                  id="dt"
                  type="date"
                  value={closureDate}
                  onChange={(e) => setClosureDate(e.target.value)}
                />
              </div>
            </>
          )}
          {mode === "rejected" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection reason</Label>
              <Textarea
                id="reason"
                rows={3}
                placeholder="Why is this lead being rejected?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
              />
            </div>
          )}
          {mode === "in_process" && (
            <p className="text-sm text-muted-foreground">
              Confirm you've started working on this lead.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={onSubmit}
            disabled={update.isPending}
            variant={mode === "rejected" ? "destructive" : "default"}
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
