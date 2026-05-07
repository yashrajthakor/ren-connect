import { useState, useMemo } from "react";
import { Plus, Inbox, Send, TrendingUp, IndianRupee } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCurrentUserId, useLeads, type Lead, type LeadStatus } from "@/hooks/useLeads";
import { LeadCard } from "@/components/leads/LeadCard";
import CreateLeadDialog from "@/components/leads/CreateLeadDialog";
import LeadDetailDialog from "@/components/leads/LeadDetailDialog";

const STATUS_FILTERS: Array<{ value: "all" | LeadStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_process", label: "In Process" },
  { value: "business_closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
];

export default function LeadsPage() {
  const { data: userId } = useCurrentUserId();
  const { data, isLoading } = useLeads(userId);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [tab, setTab] = useState<"received" | "given">("received");
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");

  const leads = data?.leads ?? [];
  const participants = data?.participants ?? {};

  const received = useMemo(() => leads.filter((l) => l.receiver_id === userId), [leads, userId]);
  const given = useMemo(() => leads.filter((l) => l.giver_id === userId), [leads, userId]);

  const list = tab === "received" ? received : given;
  const filtered = filter === "all" ? list : list.filter((l) => l.status === filter);

  const totalClosed = useMemo(
    () => leads.filter((l) => l.status === "business_closed").reduce((s, l) => s + Number(l.closure_amount || 0), 0),
    [leads]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Share, track, and close business with your network.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat icon={<Inbox className="h-4 w-4" />} label="Received" value={received.length} />
        <Stat icon={<Send className="h-4 w-4" />} label="Given" value={given.length} />
        <Stat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Closed"
          value={leads.filter((l) => l.status === "business_closed").length}
        />
        <Stat
          icon={<IndianRupee className="h-4 w-4" />}
          label="Volume"
          value={`₹${totalClosed.toLocaleString("en-IN")}`}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="received">Leads Received ({received.length})</TabsTrigger>
          <TabsTrigger value="given">Leads Given ({given.length})</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap gap-2 my-4">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-muted border-border text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <TabsContent value="received" className="m-0">
          <LeadList
            leads={filtered}
            isLoading={isLoading}
            participants={participants}
            currentUserId={userId || ""}
            onSelect={setSelectedLead}
            empty="No leads received yet."
          />
        </TabsContent>
        <TabsContent value="given" className="m-0">
          <LeadList
            leads={filtered}
            isLoading={isLoading}
            participants={participants}
            currentUserId={userId || ""}
            onSelect={setSelectedLead}
            empty="You haven't shared any leads yet."
          />
        </TabsContent>
      </Tabs>

      {/* Floating add button */}
      <button
        onClick={() => setCreateOpen(true)}
        aria-label="Share new lead"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center z-30"
      >
        <Plus className="h-6 w-6" />
      </button>

      {userId && (
        <CreateLeadDialog open={createOpen} onOpenChange={setCreateOpen} giverId={userId} />
      )}
      <LeadDetailDialog
        open={!!selectedLead}
        onOpenChange={(v) => !v && setSelectedLead(null)}
        lead={selectedLead}
        participants={participants}
        currentUserId={userId || ""}
      />
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

function LeadList({
  leads, isLoading, participants, currentUserId, onSelect, empty,
}: {
  leads: Lead[];
  isLoading: boolean;
  participants: Record<string, any>;
  currentUserId: string;
  onSelect: (l: Lead) => void;
  empty: string;
}) {
  if (isLoading) {
    return <div className="text-center text-muted-foreground py-12">Loading leads…</div>;
  }
  if (leads.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        <p>{empty}</p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {leads.map((l) => (
        <LeadCard
          key={l.id}
          lead={l}
          participants={participants}
          currentUserId={currentUserId}
          onClick={() => onSelect(l)}
        />
      ))}
    </div>
  );
}
