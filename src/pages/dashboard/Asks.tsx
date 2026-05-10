import { useState, useMemo, useEffect } from "react";
import { Plus, Search, HelpCircle, MessageCircleQuestion, CheckCircle2, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAsks, type Ask, type AskStatus } from "@/hooks/useAsks";
import { AskCard } from "@/components/asks/AskCard";
import CreateAskDialog from "@/components/asks/CreateAskDialog";
import AskDetailDialog from "@/components/asks/AskDetailDialog";

export default function AsksPage() {
  const { user } = useAuthContext();
  const userId = user?.id ?? null;
  const { data, isLoading } = useAsks(!!userId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editAsk, setEditAsk] = useState<Ask | null>(null);
  const [selected, setSelected] = useState<Ask | null>(null);
  const [tab, setTab] = useState<"open" | "mine" | "resolved" | "closed">("open");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("all");
  const [role, setRole] = useState<string>("member");

  useEffect(() => {
    supabase.rpc("get_current_user_role").then(({ data }) => {
      if (typeof data === "string") setRole(data.toLowerCase());
    });
  }, []);

  const isAdmin = role === "admin" || role === "super_admin";
  const asks = data?.asks ?? [];
  const participants = data?.participants ?? {};

  const categories = useMemo(
    () => Array.from(new Set(asks.map((a) => a.category).filter(Boolean))) as string[],
    [asks]
  );
  const cities = useMemo(
    () => Array.from(new Set(asks.map((a) => a.city).filter(Boolean))) as string[],
    [asks]
  );

  const filteredByTab = useMemo(() => {
    if (tab === "mine") return asks.filter((a) => a.user_id === userId);
    if (tab === "open") return asks.filter((a) => a.status === "open" || a.status === "in_progress");
    if (tab === "resolved") return asks.filter((a) => a.status === "resolved");
    return asks.filter((a) => a.status === "closed");
  }, [asks, tab, userId]);

  const final = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filteredByTab.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (city !== "all" && a.city !== city) return false;
      if (q && !(a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [filteredByTab, search, category, city]);

  const counts = useMemo(
    () => ({
      open: asks.filter((a) => a.status === "open" || a.status === "in_progress").length,
      mine: asks.filter((a) => a.user_id === userId).length,
      resolved: asks.filter((a) => a.status === "resolved").length,
      closed: asks.filter((a) => a.status === "closed").length,
    }),
    [asks, userId]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Ask Network</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Post requirements, find what you need, and connect directly with members.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat icon={<HelpCircle className="h-4 w-4" />} label="Open" value={counts.open} />
        <Stat icon={<MessageCircleQuestion className="h-4 w-4" />} label="My Asks" value={counts.mine} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Resolved" value={counts.resolved} />
        <Stat icon={<XCircle className="h-4 w-4" />} label="Closed" value={counts.closed} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
          <TabsTrigger value="mine">My Asks ({counts.mine})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({counts.resolved})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({counts.closed})</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search asks..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <TabsContent value={tab} className="m-0">
          <AskList
            asks={final}
            isLoading={isLoading}
            participants={participants}
            onSelect={setSelected}
            empty={tab === "mine" ? "You haven't posted any asks yet." : "No asks match your filters."}
          />
        </TabsContent>
      </Tabs>

      <button
        onClick={() => { setEditAsk(null); setCreateOpen(true); }}
        aria-label="Post new ask"
        className="fixed bottom-24 right-6 sm:bottom-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center z-30"
      >
        <Plus className="h-6 w-6" />
      </button>

      {userId && (
        <CreateAskDialog
          open={createOpen}
          onOpenChange={(v) => { setCreateOpen(v); if (!v) setEditAsk(null); }}
          userId={userId}
          editAsk={editAsk}
        />
      )}
      <AskDetailDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        ask={selected}
        participants={participants}
        currentUserId={userId || ""}
        isAdmin={isAdmin}
        onEdit={(a) => { setSelected(null); setEditAsk(a); setCreateOpen(true); }}
      />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}<span>{label}</span>
      </div>
      <p className="text-xl font-display font-bold text-foreground mt-1">{value}</p>
    </Card>
  );
}

function AskList({ asks, isLoading, participants, onSelect, empty }: {
  asks: Ask[];
  isLoading: boolean;
  participants: Record<string, any>;
  onSelect: (a: Ask) => void;
  empty: string;
}) {
  if (isLoading) return <div className="text-center text-muted-foreground py-12">Loading asks…</div>;
  if (asks.length === 0) return <Card className="p-10 text-center text-muted-foreground"><p>{empty}</p></Card>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {asks.map((a) => (
        <AskCard key={a.id} ask={a} participants={participants} onClick={() => onSelect(a)} />
      ))}
    </div>
  );
}
