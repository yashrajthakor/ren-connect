import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAsks, useDeleteAsk, useUpdateAsk, ASK_STATUS_LABEL, type Ask, type AskStatus } from "@/hooks/useAsks";
import { AskStatusBadge, AskPriorityBadge } from "@/components/asks/AskStatusBadge";
import AskDetailDialog from "@/components/asks/AskDetailDialog";
import CreateAskDialog from "@/components/asks/CreateAskDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";

const STATUSES: AskStatus[] = ["open", "in_progress", "resolved", "closed"];

export default function AdminAsks() {
  const { user } = useAuthContext();
  const { data, isLoading } = useAsks(true);
  const update = useUpdateAsk();
  const del = useDeleteAsk();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Ask | null>(null);
  const [editAsk, setEditAsk] = useState<Ask | null>(null);

  const asks = data?.asks ?? [];
  const participants = data?.participants ?? {};

  const counts: Record<AskStatus, number> = {
    open: asks.filter((a) => a.status === "open").length,
    in_progress: asks.filter((a) => a.status === "in_progress").length,
    resolved: asks.filter((a) => a.status === "resolved").length,
    closed: asks.filter((a) => a.status === "closed").length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ask?")) return;
    try { await del.mutateAsync(id); toast({ title: "Ask deleted" }); }
    catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">Asks Management</h1>
      <p className="text-muted-foreground text-sm mb-6">Moderate community asks and update statuses.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATUSES.map((s) => (
          <Card key={s} className="p-4">
            <p className="text-xs text-muted-foreground">{ASK_STATUS_LABEL[s]}</p>
            <p className="text-xl font-display font-bold mt-1">{counts[s]}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Posted</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : asks.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No asks yet.</td></tr>
              ) : asks.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(a)}>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{a.title}</td>
                  <td className="px-4 py-3">{participants[a.user_id]?.name || "—"}</td>
                  <td className="px-4 py-3">{a.category || "—"}</td>
                  <td className="px-4 py-3">{a.city || "—"}</td>
                  <td className="px-4 py-3"><AskStatusBadge status={a.status} /></td>
                  <td className="px-4 py-3"><AskPriorityBadge priority={a.priority} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AskDetailDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        ask={selected}
        participants={participants}
        currentUserId={user?.id || ""}
        isAdmin
        onEdit={(a) => { setSelected(null); setEditAsk(a); }}
      />
      {user?.id && (
        <CreateAskDialog
          open={!!editAsk}
          onOpenChange={(v) => !v && setEditAsk(null)}
          userId={user.id}
          editAsk={editAsk}
        />
      )}
    </div>
  );
}
