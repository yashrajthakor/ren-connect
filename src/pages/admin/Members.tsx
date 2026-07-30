import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Search, Award, X, Users, Download, Sparkles, Check, ChevronsUpDown } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  invited_by_member_id?: string | null;
  invited_by_name?: string | null;
  business_name?: string | null;
  paid_joining_date?: string | null;
  paid_valid_through?: string | null;
};

/** "YYYY-MM-DD" for <input type="date">, built from local Y/M/D to avoid UTC off-by-one shifts. */
function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Joining Date + 1 year - 1 day, e.g. 15 Aug 2026 → 14 Aug 2027. */
function computeValidThrough(joiningDateStr: string): string {
  const [y, m, d] = joiningDateStr.split("-").map(Number);
  const joined = new Date(y, m - 1, d);
  const validThrough = new Date(joined.getFullYear() + 1, joined.getMonth(), joined.getDate() - 1);
  return toDateInputValue(validThrough);
}

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
  const [searchParams] = useSearchParams();
  // Arriving from the admin dashboard's Paid Members KPI card pre-applies this filter.
  const [membershipFilter, setMembershipFilter] = useState<"all" | "paid_member" | "visitor">(
    () => (searchParams.get("membership") as "paid_member" | "visitor" | null) ?? "all"
  );
  const [updatingMembershipId, setUpdatingMembershipId] = useState<string | null>(null);

  // Visitor → Paid Member requires picking an existing active Paid Member
  // as "Invited By", plus Joining Date and Valid Through, before the
  // conversion is allowed to save.
  const [convertingMember, setConvertingMember] = useState<Member | null>(null);
  const [inviterSearch, setInviterSearch] = useState("");
  const [inviterComboOpen, setInviterComboOpen] = useState(false);
  const [selectedInviterId, setSelectedInviterId] = useState<string>("");
  const [joiningDate, setJoiningDate] = useState<string>("");
  const [validThrough, setValidThrough] = useState<string>("");
  const [converting, setConverting] = useState(false);

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

  // Selecting "Paid Member" for a Visitor opens the Paid Member Details
  // dialog instead of saving immediately; downgrading to Visitor needs no
  // extra step.
  const handleMembershipSelect = (m: Member, value: "visitor" | "paid_member") => {
    if (value === "paid_member" && (m.membership_type || "visitor") !== "paid_member") {
      setConvertingMember(m);
      setSelectedInviterId("");
      setInviterSearch("");
      setJoiningDate("");
      setValidThrough("");
    } else {
      changeMembership(m, value);
    }
  };

  // Existing Paid Members can also edit their Invited By / Joining Date /
  // Valid Through later (e.g. to backfill history or renew membership).
  const openPaidMemberDetails = (m: Member) => {
    setConvertingMember(m);
    setSelectedInviterId(m.invited_by_member_id || "");
    setInviterSearch("");
    setJoiningDate(m.paid_joining_date || "");
    setValidThrough(m.paid_valid_through || "");
  };

  const activePaidMembers = useMemo(
    () =>
      members.filter(
        (x) =>
          (x.membership_type || "visitor") === "paid_member" &&
          x.status === "active" &&
          x.member_id !== convertingMember?.member_id
      ),
    [members, convertingMember]
  );

  const filteredInviters = useMemo(() => {
    const q = inviterSearch.trim().toLowerCase();
    if (!q) return activePaidMembers.slice(0, 30);
    return activePaidMembers
      .filter(
        (x) =>
          x.full_name?.toLowerCase().includes(q) ||
          (x.business_name || "").toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [activePaidMembers, inviterSearch]);

  const selectedInviter = activePaidMembers.find((x) => x.member_id === selectedInviterId);
  // Already a Paid Member → we're only editing the inviter, not converting.
  const isEditingInviterOnly = (convertingMember?.membership_type || "visitor") === "paid_member";

  const detailsIncomplete = !selectedInviterId || !joiningDate || !validThrough;

  const confirmConvert = async () => {
    if (!convertingMember || detailsIncomplete) return;
    setConverting(true);
    const { error } = isEditingInviterOnly
      ? await (supabase as any).rpc("set_paid_member_details", {
          _member_id: convertingMember.member_id,
          _invited_by_member_id: selectedInviterId,
          _joining_date: joiningDate,
          _valid_through: validThrough,
        })
      : await (supabase as any).rpc("set_membership_type", {
          _member_id: convertingMember.member_id,
          _type: "paid_member",
          _invited_by_member_id: selectedInviterId,
          _joining_date: joiningDate,
          _valid_through: validThrough,
        });
    setConverting(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    const inviterName = selectedInviter?.full_name || "";
    setMembers((prev) =>
      prev.map((x) =>
        x.member_id === convertingMember.member_id
          ? {
              ...x,
              membership_type: "paid_member",
              invited_by_member_id: selectedInviterId,
              invited_by_name: inviterName,
              paid_joining_date: joiningDate,
              paid_valid_through: validThrough,
            }
          : x
      )
    );
    toast(
      isEditingInviterOnly
        ? { title: "Paid Member details updated", description: convertingMember.full_name }
        : {
            title: "Membership updated",
            description: `${convertingMember.full_name} → Paid Member (invited by ${inviterName || "—"})`,
          }
    );
    setConvertingMember(null);
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Select
                            value={m.membership_type || "visitor"}
                            onValueChange={(v) => handleMembershipSelect(m, v as "visitor" | "paid_member")}
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
                        {(m.membership_type || "visitor") === "paid_member" && (
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {m.invited_by_name || m.paid_valid_through ? (
                              <div className="flex flex-wrap items-center gap-x-1.5">
                                {m.invited_by_name && (
                                  <span>
                                    Invited by <span className="font-medium text-foreground">{m.invited_by_name}</span>
                                  </span>
                                )}
                                {m.paid_valid_through && (
                                  <span>
                                    · Valid through{" "}
                                    <span className="font-medium text-foreground">
                                      {new Date(m.paid_valid_through + "T00:00:00").toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openPaidMemberDetails(m)}
                                  className="font-medium text-primary hover:underline"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openPaidMemberDetails(m)}
                                className="font-medium text-primary hover:underline"
                              >
                                + Add Paid Member details
                              </button>
                            )}
                          </div>
                        )}
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

      <Dialog open={!!convertingMember} onOpenChange={(o) => !o && !converting && setConvertingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingInviterOnly ? "Paid Member Details" : "Convert to Paid Member"}</DialogTitle>
            <DialogDescription>
              {convertingMember && (
                <>
                  {isEditingInviterOnly ? "Update" : "Record"} the Invited By, Joining Date and Valid Through for{" "}
                  <strong>{convertingMember.full_name}</strong>
                  {isEditingInviterOnly ? "." : " to complete the upgrade."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Invited By</Label>
            <Popover open={inviterComboOpen} onOpenChange={setInviterComboOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={inviterComboOpen}
                  className="w-full flex items-center justify-between gap-2 border rounded-lg p-3 text-left hover:bg-muted/40 transition-colors"
                >
                  {selectedInviter ? (
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{selectedInviter.full_name}</p>
                      {selectedInviter.business_name && (
                        <p className="text-xs text-muted-foreground truncate">{selectedInviter.business_name}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Search by member or business name…</span>
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by name or business..."
                    value={inviterSearch}
                    onValueChange={setInviterSearch}
                  />
                  <CommandList className="max-h-56">
                    <CommandEmpty>No active Paid Members found</CommandEmpty>
                    <CommandGroup>
                      {filteredInviters.map((x) => (
                        <CommandItem
                          key={x.member_id}
                          value={x.member_id}
                          onSelect={() => {
                            setSelectedInviterId(x.member_id);
                            setInviterComboOpen(false);
                            setInviterSearch("");
                          }}
                          className="flex items-center gap-2 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{x.full_name}</p>
                            {x.business_name && (
                              <p className="text-xs text-muted-foreground truncate">{x.business_name}</p>
                            )}
                          </div>
                          {selectedInviterId === x.member_id && (
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">Required.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="joining-date">Joining Date</Label>
              <Input
                id="joining-date"
                type="date"
                value={joiningDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setJoiningDate(v);
                  // Auto-calc Valid Through = Joining Date + 1 year - 1 day.
                  // Admin can still edit Valid Through afterwards.
                  setValidThrough(v ? computeValidThrough(v) : "");
                }}
              />
              <p className="text-xs text-muted-foreground">Required.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid-through">Valid Through</Label>
              <Input
                id="valid-through"
                type="date"
                value={validThrough}
                min={joiningDate || undefined}
                onChange={(e) => setValidThrough(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto-set to 1 year from Joining Date — editable.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertingMember(null)} disabled={converting}>
              Cancel
            </Button>
            <Button variant="royal" onClick={confirmConvert} disabled={converting || detailsIncomplete}>
              {converting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
