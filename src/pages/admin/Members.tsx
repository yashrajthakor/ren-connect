import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Award, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Member = {
  member_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  chapter_name: string | null;
  status: string | null;
  committee_badge: string | null;
};

const PRESET_BADGES = [
  "President",
  "Vice President",
  "TL-Design",
  "TL-Marketing",
  "TL-Sales",
  "Core Member",
  "Executive Member",
];

const Members = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [badgeChoice, setBadgeChoice] = useState<string>("");
  const [customBadge, setCustomBadge] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_members_for_admin");
    if (error) {
      toast({ title: "Failed to load members", description: error.message, variant: "destructive" });
      setMembers([]);
    } else {
      setMembers((data as Member[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.committee_badge || "").toLowerCase().includes(q),
    );
  }, [members, search]);

  const openEdit = (m: Member) => {
    setEditing(m);
    if (m.committee_badge && PRESET_BADGES.includes(m.committee_badge)) {
      setBadgeChoice(m.committee_badge);
      setCustomBadge("");
    } else if (m.committee_badge) {
      setBadgeChoice("__custom__");
      setCustomBadge(m.committee_badge);
    } else {
      setBadgeChoice("");
      setCustomBadge("");
    }
  };

  const save = async (clear = false) => {
    if (!editing) return;
    const value = clear
      ? ""
      : badgeChoice === "__custom__"
        ? customBadge.trim()
        : badgeChoice;
    setSaving(true);
    const { error } = await supabase.rpc("set_committee_badge", {
      _member_id: editing.member_id,
      _badge: value,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: clear || !value ? "Badge removed" : "Badge updated",
      description: editing.full_name,
    });
    setEditing(null);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">Manage Members</h1>
          <p className="text-muted-foreground">Assign committee badges to active members.</p>
        </div>

        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, badge"
            className="pl-9"
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading members...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No members found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Full Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Chapter</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead className="min-w-[150px]">Committee Badge</TableHead>
                    <TableHead className="w-32 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.member_id}>
                      <TableCell>
                        <div className="font-medium">{m.full_name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{m.email || "—"}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{m.chapter_name || "—"}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          <Badge variant="outline" className="capitalize text-[10px]">{m.status || "—"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{m.email || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{m.chapter_name || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="capitalize">{m.status || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        {m.committee_badge ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                            <Award className="h-3 w-3" />
                            {m.committee_badge}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                          {m.committee_badge ? "Edit" : "Assign"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Committee Badge</DialogTitle>
            <DialogDescription>
              {editing && <>Assign a leadership badge for <strong>{editing.full_name}</strong>.</>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Badge</Label>
              <Select value={badgeChoice} onValueChange={setBadgeChoice}>
                <SelectTrigger><SelectValue placeholder="Select a badge" /></SelectTrigger>
                <SelectContent>
                  {PRESET_BADGES.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {badgeChoice === "__custom__" && (
              <div>
                <Label>Custom badge label</Label>
                <Input
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  placeholder="e.g. TL-Operations"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {editing?.committee_badge && (
              <Button variant="ghost" onClick={() => save(true)} disabled={saving} className="mr-auto">
                <X className="h-4 w-4 mr-1" /> Remove badge
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button
              variant="royal"
              onClick={() => save(false)}
              disabled={saving || !badgeChoice || (badgeChoice === "__custom__" && !customBadge.trim())}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
