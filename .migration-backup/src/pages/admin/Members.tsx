import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Award, X, Users, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
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
import MultiCategorySelect, { CategoryOption } from "@/components/categories/MultiCategorySelect";

type Member = {
  member_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  chapter_name: string | null;
  status: string | null;
  committee_badge: string | null;
  category_ids?: string[] | null;
  categories?: string[] | null;
  referral_count?: number | null;
  membership_type?: "visitor" | "paid_member" | null;
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
  const [catEditing, setCatEditing] = useState<Member | null>(null);
  const [catIds, setCatIds] = useState<string[]>([]);
  const [allCats, setAllCats] = useState<CategoryOption[]>([]);
  const [savingCats, setSavingCats] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [membershipFilter, setMembershipFilter] = useState<"all" | "paid_member" | "visitor">("all");
  const [updatingMembershipId, setUpdatingMembershipId] = useState<string | null>(null);

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

  useEffect(() => {
    load();
    (async () => {
      const { data } = await (supabase as any)
        .from("business_categories").select("id,name").order("name");
      setAllCats((data as CategoryOption[]) || []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchType =
        membershipFilter === "all" ||
        (m.membership_type || "visitor") === membershipFilter;
      if (!matchType) return false;
      if (!q) return true;
      return (
        m.full_name?.toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.committee_badge || "").toLowerCase().includes(q)
      );
    });
  }, [members, search, membershipFilter]);

  const changeMembership = async (m: Member, value: "visitor" | "paid_member") => {
    if ((m.membership_type || "visitor") === value) return;
    setUpdatingMembershipId(m.member_id);
    const { error } = await (supabase as any).rpc("set_membership_type", {
      _member_id: m.member_id,
      _type: value,
    });
    setUpdatingMembershipId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setMembers((prev) =>
      prev.map((x) => (x.member_id === m.member_id ? { ...x, membership_type: value } : x)),
    );
    toast({
      title: "Membership updated",
      description: `${m.full_name} → ${value === "paid_member" ? "Paid Member" : "Visitor"}`,
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await (supabase as any).rpc("export_members_for_admin");
      if (error) throw error;
      const q = search.trim().toLowerCase();
      const rows = ((data as any[]) || []).filter((m) => {
        if (!q) return true;
        return (
          (m.full_name || "").toLowerCase().includes(q) ||
          (m.email || "").toLowerCase().includes(q) ||
          (m.phone || "").toLowerCase().includes(q) ||
          (m.city || "").toLowerCase().includes(q) ||
          (m.committee_badge || "").toLowerCase().includes(q) ||
          ((m.categories as string[]) || []).some((c) => (c || "").toLowerCase().includes(q))
        );
      });

      const sheetRows = rows.map((m, i) => ({
        "#": i + 1,
        "Member Name": m.full_name || "",
        "Phone Number": m.phone || "",
        "Email Address": m.email || "",
        "City": m.city || "",
        "Business Category": ((m.categories as string[]) || []).join(", "),
        "Services Offered": m.services || "",
        "Referral Person Name": m.referral_person || "",
        "Join Date": m.join_date ? new Date(m.join_date).toLocaleDateString("en-IN") : "",
        "Approval Status": (m.status || "").toString().replace(/_/g, " "),
        "Membership Type": (m.membership_type === "paid_member" ? "Paid Member" : "Visitor"),
        "Attendance": "",
        "Signature": "",
        "Remarks": "",
      }));

      const ws = XLSX.utils.json_to_sheet(sheetRows);
      ws["!cols"] = [
        { wch: 5 }, { wch: 22 }, { wch: 15 }, { wch: 26 }, { wch: 14 },
        { wch: 24 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 14 },
        { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Members");
      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `RBN_Members_${today}.xlsx`);
      toast({ title: "Export ready", description: `${sheetRows.length} members exported.` });
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

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

  const openCatEdit = (m: Member) => {
    setCatEditing(m);
    setCatIds(m.category_ids || []);
  };

  const saveCats = async () => {
    if (!catEditing) return;
    setSavingCats(true);
    const { error } = await (supabase as any).rpc("admin_set_member_categories", {
      _member_id: catEditing.member_id,
      _ids: catIds,
    });
    setSavingCats(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Categories updated", description: catEditing.full_name });
    setCatEditing(null);
    load();
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, badge"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            {([
              { v: "all", label: "All Members" },
              { v: "paid_member", label: "Paid Members" },
              { v: "visitor", label: "Visitors" },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                onClick={() => setMembershipFilter(opt.v)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  membershipFilter === opt.v
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-secondary border-border hover:border-primary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            variant="royal"
            onClick={handleExport}
            disabled={exporting}
            className="sm:ml-auto whitespace-nowrap"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Export Members
          </Button>
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
                    <TableHead className="min-w-[180px]">Categories</TableHead>
                    <TableHead className="min-w-[160px]">Membership Type</TableHead>
                    <TableHead className="w-24 text-center">Referrals</TableHead>
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
                        <div className="text-xs text-muted-foreground sm:hidden">
                          Referrals: <span className="font-semibold">{m.referral_count ?? 0}</span>
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
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(m.categories || []).slice(0, 3).map((c) => (
                            <span key={c} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                              {c}
                            </span>
                          ))}
                          {(m.categories || []).length > 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                              +{(m.categories || []).length - 3}
                            </span>
                          )}
                          {(!m.categories || m.categories.length === 0) && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => openCatEdit(m)}>Edit</Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={m.membership_type || "visitor"}
                            onValueChange={(v) => changeMembership(m, v as "visitor" | "paid_member")}
                            disabled={updatingMembershipId === m.member_id}
                          >
                            <SelectTrigger className="h-8 w-[140px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="visitor">Visitor</SelectItem>
                              <SelectItem value="paid_member">Paid Member</SelectItem>
                            </SelectContent>
                          </Select>
                          {(m.membership_type || "visitor") === "paid_member" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">
                              <Sparkles className="h-3 w-3" /> Valuable
                            </span>
                          )}
                          {updatingMembershipId === m.member_id && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${(m.referral_count ?? 0) > 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                          <Users className="h-3 w-3" />
                          {m.referral_count ?? 0}
                        </span>
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

      <Dialog open={!!catEditing} onOpenChange={(o) => !o && setCatEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Member Categories</DialogTitle>
            <DialogDescription>
              {catEditing && <>Assign business categories for <strong>{catEditing.full_name}</strong>.</>}
            </DialogDescription>
          </DialogHeader>
          <MultiCategorySelect options={allCats} value={catIds} onChange={setCatIds} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatEditing(null)} disabled={savingCats}>Cancel</Button>
            <Button variant="royal" onClick={saveCats} disabled={savingCats}>
              {savingCats && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
