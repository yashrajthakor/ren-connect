import { useState } from "react";
import { Phone, User, Calendar, IndianRupee, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeadStatusBadge, PriorityBadge } from "./LeadStatusBadge";
import UpdateStatusDialog from "./UpdateStatusDialog";
import { useLeadHistory, type Lead, type MemberLite, STATUS_LABEL } from "@/hooks/useLeads";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: Lead | null;
  participants: Record<string, MemberLite>;
  currentUserId: string;
}

function initials(name: string) {
  return (name || "?")
    .split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function LeadDetailDialog({
  open,
  onOpenChange,
  lead,
  participants,
  currentUserId,
}: Props) {
  const [statusMode, setStatusMode] = useState<"in_process" | "business_closed" | "rejected" | null>(null);
  const { data: history = [], isLoading } = useLeadHistory(open && lead ? lead.id : null);

  if (!lead) return null;

  const isReceiver = lead.receiver_id === currentUserId;
  const giver = participants[lead.giver_id];
  const receiver = participants[lead.receiver_id];

  const canMarkInProcess = isReceiver && lead.status === "pending";
  const canClose = isReceiver && (lead.status === "pending" || lead.status === "in_process");
  const canReject = isReceiver && (lead.status === "pending" || lead.status === "in_process");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {lead.lead_name}
              <LeadStatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
            </DialogTitle>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Lead giver</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={giver?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{initials(giver?.name || "")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{giver?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground truncate">{giver?.business}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Assigned to</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={receiver?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{initials(receiver?.name || "")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{receiver?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground truncate">{receiver?.business}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <Row icon={<Phone className="h-4 w-4" />} label="Contact" value={lead.contact_number} />
            {lead.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm bg-muted/40 rounded-md p-3 whitespace-pre-wrap">{lead.description}</p>
              </div>
            )}
            <Row
              icon={<Calendar className="h-4 w-4" />}
              label="Created"
              value={new Date(lead.created_at).toLocaleString()}
            />
            {lead.status === "business_closed" && (
              <Row
                icon={<IndianRupee className="h-4 w-4" />}
                label="Closure"
                value={`₹${Number(lead.closure_amount || 0).toLocaleString("en-IN")} on ${
                  lead.closure_date ? new Date(lead.closure_date).toLocaleDateString() : "—"
                }`}
              />
            )}
            {lead.status === "rejected" && lead.rejection_reason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive">Rejection reason</p>
                  <p className="text-sm">{lead.rejection_reason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold mb-2">Status timeline</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ol className="relative border-l border-border ml-2 space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="ml-4">
                    <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm">
                      {h.from_status ? `${STATUS_LABEL[h.from_status]} → ` : ""}
                      <span className="font-medium">{STATUS_LABEL[h.to_status]}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString()}
                      {h.note ? ` · ${h.note}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {(canMarkInProcess || canClose || canReject) && (
            <div className="mt-5 pt-4 border-t flex flex-wrap gap-2 justify-end">
              {canMarkInProcess && (
                <Button variant="secondary" onClick={() => setStatusMode("in_process")}>
                  Mark In Process
                </Button>
              )}
              {canReject && (
                <Button variant="destructive" onClick={() => setStatusMode("rejected")}>
                  Reject
                </Button>
              )}
              {canClose && (
                <Button onClick={() => setStatusMode("business_closed")}>
                  Mark Business Closed
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {statusMode && (
        <UpdateStatusDialog
          open={!!statusMode}
          onOpenChange={(v) => !v && setStatusMode(null)}
          lead={lead}
          mode={statusMode}
        />
      )}
    </>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
