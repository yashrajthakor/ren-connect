import { useState, useMemo, useEffect } from "react";
import { Plus, Inbox, Send, TrendingUp, IndianRupee, Heart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUserId, useLeads, type Lead, type LeadStatus } from "@/hooks/useLeads";
import { LeadCard } from "@/components/leads/LeadCard";
import CreateLeadDialog from "@/components/leads/CreateLeadDialog";
import LeadDetailDialog from "@/components/leads/LeadDetailDialog";
import ThankMemberDialog from "@/components/leads/ThankMemberDialog";
import PendingApprovalGate from "@/components/dashboard/PendingApprovalGate";
import { DRAFT_KEYS, readFormDraft } from "@/lib/formDraft";

const STATUS_FILTERS: Array<{ value: "all" | LeadStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_process", label: "In Process" },
  { value: "business_closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
];

function LeadsPageInner() {
  const { data: userId } = useCurrentUserId();
  const { data, isLoading } = useLeads(userId);
  const [createOpen, setCreateOpen] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [tab, setTab] = useState<"received" | "given">("received");
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");

  // Reopen an unfinished form after the app was backgrounded/reloaded
  // mid-entry, so the user continues exactly where they left off.
  useEffect(() => {
    if (readFormDraft(DRAFT_KEYS.createLead)) setCreateOpen(true);
    else if (readFormDraft(DRAFT_KEYS.thankMember)) setThanksOpen(true);
  }, []);

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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">My Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Share, track, and close business with your network.
        </p>
      </div>

      <div className="mb-6 flex gap-3 overflow-x-auto snap-x pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 md:grid-cols-4 sm:overflow-visible sm:pb-0">
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

      {/* Floating action button with speed-dial menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Lead actions"
            className="fixed bottom-24 right-6 sm:bottom-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center z-30 [&>svg]:transition-transform [&>svg]:duration-200 data-[state=open]:[&>svg]:rotate-45"
          >
            <Plus className="h-6 w-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={12} className="w-72 rounded-xl p-1.5">
          <DropdownMenuItem
            onSelect={() => setCreateOpen(true)}
            className="items-start gap-3 rounded-lg p-3 cursor-pointer"
          >
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 shrink-0">
              <Send className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">Create Lead</p>
              <p className="text-xs text-muted-foreground">
                Pass a new business lead to another member.
              </p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setThanksOpen(true)}
            className="items-start gap-3 rounded-lg p-3 cursor-pointer"
          >
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 shrink-0">
              <Heart className="h-4 w-4 text-primary fill-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">Thank a Member</p>
              <p className="text-xs text-muted-foreground">
                Appreciate a member after successfully completing business together.
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {userId && (
        <CreateLeadDialog open={createOpen} onOpenChange={setCreateOpen} giverId={userId} />
      )}
      <ThankMemberDialog open={thanksOpen} onOpenChange={setThanksOpen} />
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

export default function LeadsPage() {
  return (
    <PendingApprovalGate featureName="My Leads">
      <LeadsPageInner />
    </PendingApprovalGate>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="w-[8.25rem] shrink-0 snap-start p-3.5 sm:w-auto sm:shrink sm:p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 truncate font-display text-lg font-bold text-foreground sm:text-xl">{value}</p>
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
