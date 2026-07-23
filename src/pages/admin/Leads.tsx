import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { LeadStatusBadge, PriorityBadge } from "@/components/leads/LeadStatusBadge";
import { useAdminLeads, useDeleteLead, type Lead } from "@/hooks/useLeads";
import { TrendingUp, Inbox, CheckCircle2, XCircle, IndianRupee, Percent, Trash2 } from "lucide-react";
import { friendlyError } from "@/lib/errors";
import AdminFilterBanner from "@/components/admin/AdminFilterBanner";

export default function AdminLeadsPage() {
  const { data, isLoading } = useAdminLeads(true);
  const allLeads = data?.leads ?? [];
  const participants = data?.participants ?? {};
  const deleteLead = useDeleteLead();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);

  // Arriving from the admin dashboard's Referrals/Business Generated KPI
  // cards pre-applies the same date range that produced those numbers.
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const leads = useMemo(() => {
    if (!fromParam && !toParam) return allLeads;
    const fromTime = fromParam ? new Date(fromParam).getTime() : -Infinity;
    const toTime = toParam ? new Date(toParam).getTime() : Infinity;
    return allLeads.filter((l) => {
      const t = new Date(l.created_at).getTime();
      return t >= fromTime && t < toTime;
    });
  }, [allLeads, fromParam, toParam]);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteLead.mutateAsync(confirmDelete.id);
      toast({ title: "Lead deleted" });
      setConfirmDelete(null);
    } catch (e) {
      toast({
        title: "Could not delete lead",
        description: friendlyError(e, "Something went wrong. Please try again."),
        variant: "destructive",
      });
    }
  };

  const stats = useMemo(() => {
    const closed = leads.filter((l) => l.status === "business_closed");
    const volume = closed.reduce((s, l) => s + Number(l.closure_amount || 0), 0);
    return {
      total: leads.length,
      pending: leads.filter((l) => l.status === "pending").length,
      inProcess: leads.filter((l) => l.status === "in_process").length,
      closed: closed.length,
      rejected: leads.filter((l) => l.status === "rejected").length,
      volume,
      conversion: leads.length ? Math.round((closed.length / leads.length) * 100) : 0,
    };
  }, [leads]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Leads & Business Tracking</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor referral activity and business volume across RBN.
        </p>
      </div>

      {(fromParam || toParam) && (
        <AdminFilterBanner
          label={`Showing leads from ${fromParam ? new Date(fromParam).toLocaleDateString() : "the beginning"} to ${
            toParam ? new Date(toParam).toLocaleDateString() : "now"
          }`}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <Stat icon={<Inbox className="h-4 w-4" />} label="Total Leads" value={stats.total} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="In Process" value={stats.inProcess} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Closed" value={stats.closed} />
        <Stat icon={<XCircle className="h-4 w-4" />} label="Rejected" value={stats.rejected} />
        <Stat icon={<Percent className="h-4 w-4" />} label="Conversion" value={`${stats.conversion}%`} />
        <Stat icon={<IndianRupee className="h-4 w-4" />} label="Volume" value={`₹${stats.volume.toLocaleString("en-IN")}`} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold min-w-[200px]">Lead</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">From</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">To</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Priority</th>
                <th className="px-4 py-3 font-semibold text-right">Closure</th>
                <th className="px-4 py-3 font-semibold hidden xl:table-cell">Created</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={8} className="text-center text-muted-foreground py-8">Loading…</td></tr>
              )}
              {!isLoading && leads.length === 0 && (
                <tr><td colSpan={8} className="text-center text-muted-foreground py-8">No leads yet.</td></tr>
              )}
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{l.lead_name}</p>
                    <p className="text-xs text-muted-foreground">{l.contact_number}</p>
                    <div className="text-xs text-muted-foreground sm:hidden">
                      From: {participants[l.giver_id]?.name || "—"} → To: {participants[l.receiver_id]?.name || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground sm:hidden">
                      {new Date(l.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">{participants[l.giver_id]?.name || "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{participants[l.receiver_id]?.name || "—"}</td>
                  <td className="px-4 py-3"><LeadStatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><PriorityBadge priority={l.priority} /></td>
                  <td className="px-4 py-3 text-right font-medium">
                    {l.closure_amount ? `₹${Number(l.closure_amount).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden xl:table-cell">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmDelete(l)}
                      title="Delete lead"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lead
              {confirmDelete ? ` "${confirmDelete.lead_name}"` : ""} for both the giver and receiver. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLead.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              disabled={deleteLead.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLead.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xl font-display font-bold text-foreground mt-1">{value}</p>
    </Card>
  );
}
