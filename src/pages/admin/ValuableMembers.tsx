import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DateRange as DayPickerRange } from "react-day-picker";
import {
  Award,
  Search,
  Loader2,
  MoreVertical,
  User,
  FileText,
  RefreshCcw,
  Activity,
  CalendarCheck2,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UserPlus,
  CalendarIcon,
  Plus,
  Pencil,
  FilterX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useValuableMembers, type ValuableMember } from "@/hooks/useValuableMembers";
import { useMembersRoster } from "@/hooks/useMembersRoster";
import { getMembershipStatus, isExpiringThisMonth, formatDateOrNA } from "@/lib/membershipStatus";
import { MembershipStatusBadge } from "@/components/admin/MembershipStatusBadge";
import { getPresetRange, PRESET_LABELS, type DatePreset } from "@/lib/dateRanges";
import ConvertToPaidMemberDialog from "@/components/admin/ConvertToPaidMemberDialog";
import MemberFilterCombobox, { ALL_MEMBERS, type MemberFilterOption } from "@/components/admin/MemberFilterCombobox";

type StatusFilter = "all" | "active" | "expiring_soon" | "expired";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
];

const PRESET_ORDER: DatePreset[] = ["today", "week", "month", "year", "custom"];

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

/** Status/Joining Date/Valid Through checks shared by the table filter and
 * the Invited By option counts (which must reflect those same filters,
 * minus Invited By itself, or picking an option would recompute its own count). */
function matchesStructuralFilters(
  m: ValuableMember,
  statusFilter: StatusFilter,
  joiningFrom: string,
  joiningTo: string,
  validFrom: string,
  validTo: string
): boolean {
  if (statusFilter !== "all" && getMembershipStatus(m.paid_valid_through) !== statusFilter) return false;
  // paid_joining_date / paid_valid_through and the <input type="date"> values
  // are both plain "YYYY-MM-DD" strings, so lexicographic comparison is safe.
  if (joiningFrom && (!m.paid_joining_date || m.paid_joining_date < joiningFrom)) return false;
  if (joiningTo && (!m.paid_joining_date || m.paid_joining_date > joiningTo)) return false;
  if (validFrom && (!m.paid_valid_through || m.paid_valid_through < validFrom)) return false;
  if (validTo && (!m.paid_valid_through || m.paid_valid_through > validTo)) return false;
  return true;
}

function DateRangeField({
  label,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  label: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-9 w-[142px] text-sm"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="h-9 w-[142px] text-sm"
        />
      </div>
    </div>
  );
}

export default function ValuableMembers() {
  const navigate = useNavigate();
  const { data: members = [], isLoading, isError, refetch } = useValuableMembers();
  // Full roster (Visitors + Paid Members), needed only to feed the shared
  // conversion dialog's Visitor/Invited-By search — this page's own list
  // above is deliberately Paid-Members-only.
  const { data: roster = [], refetch: refetchRoster } = useMembersRoster();
  const [addOpen, setAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ValuableMember | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [joiningFrom, setJoiningFrom] = useState("");
  const [joiningTo, setJoiningTo] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [inviterFilter, setInviterFilter] = useState<string>(ALL_MEMBERS);

  // Drives only the "New Valuable Members" KPI — everything else on this
  // page is a live snapshot of current membership state.
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customRange, setCustomRange] = useState<DayPickerRange | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { start, end } = useMemo(() => {
    if (preset === "custom" && customRange?.from && customRange?.to) {
      return getPresetRange("custom", { from: customRange.from, to: customRange.to });
    }
    return getPresetRange(preset === "custom" ? "month" : preset);
  }, [preset, customRange]);

  const stats = useMemo(() => {
    let active = 0;
    let expiringThisMonth = 0;
    let expired = 0;
    let newInRange = 0;
    for (const m of members) {
      const status = getMembershipStatus(m.paid_valid_through);
      if (status === "active") active++;
      if (status === "expired") expired++;
      if (isExpiringThisMonth(m.paid_valid_through)) expiringThisMonth++;
      if (m.paid_joining_date) {
        const jd = new Date(m.paid_joining_date + "T00:00:00");
        if (jd >= start && jd < end) newInRange++;
      }
    }
    return { total: members.length, active, expiringThisMonth, expired, newInRange };
  }, [members, start, end]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (!matchesStructuralFilters(m, statusFilter, joiningFrom, joiningTo, validFrom, validTo)) return false;
      // invited_by_member_id keys on members.id, not auth user_id — the
      // combobox's "user_id" slot is reused below to hold a member_id instead.
      if (inviterFilter !== ALL_MEMBERS && m.invited_by_member_id !== inviterFilter) return false;
      if (!q) return true;
      return (
        m.full_name?.toLowerCase().includes(q) ||
        (m.business_name || "").toLowerCase().includes(q) ||
        (m.phone || "").toLowerCase().includes(q)
      );
    });
  }, [members, search, statusFilter, joiningFrom, joiningTo, validFrom, validTo, inviterFilter]);

  // Every Valuable Member is a possible inviter — list them all, annotated
  // with how many members (under the other active filters) they've invited,
  // 0 if none — so the filter always shows the full roster, not just people
  // who already have an inductee in view.
  const inviterOptions = useMemo<MemberFilterOption[]>(() => {
    const counts = new Map<string, number>();
    for (const m of members) {
      if (!matchesStructuralFilters(m, statusFilter, joiningFrom, joiningTo, validFrom, validTo)) continue;
      if (!m.invited_by_member_id) continue;
      counts.set(m.invited_by_member_id, (counts.get(m.invited_by_member_id) || 0) + 1);
    }
    return members
      .map((vm) => ({
        user_id: vm.member_id,
        name: vm.full_name,
        business: vm.business_name,
        count: counts.get(vm.member_id) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, statusFilter, joiningFrom, joiningTo, validFrom, validTo]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    !!joiningFrom ||
    !!joiningTo ||
    !!validFrom ||
    !!validTo ||
    inviterFilter !== ALL_MEMBERS;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setJoiningFrom("");
    setJoiningTo("");
    setValidFrom("");
    setValidTo("");
    setInviterFilter(ALL_MEMBERS);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" /> Valuable Members
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage active Valuable Members, track membership validity, and prepare for renewals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={preset}
            onValueChange={(v) => {
              setPreset(v as DatePreset);
              setPickerOpen(v === "custom");
            }}
          >
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_ORDER.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRESET_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preset === "custom" && (
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted transition-colors"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {customRange?.from && customRange?.to
                    ? `${customRange.from.toLocaleDateString()} – ${customRange.to.toLocaleDateString()}`
                    : "Pick dates"}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={setCustomRange}
                  numberOfMonths={2}
                  defaultMonth={customRange?.from}
                />
              </PopoverContent>
            </Popover>
          )}
          <Button variant="royal" onClick={() => setAddOpen(true)} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-1.5" /> New Valuable Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <Stat icon={<Award className="h-4 w-4" />} label="Total Valuable Members" value={stats.total} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Active Memberships" value={stats.active} />
        <Stat icon={<AlertTriangle className="h-4 w-4" />} label="Expiring This Month" value={stats.expiringThisMonth} />
        <Stat icon={<XCircle className="h-4 w-4" />} label="Expired Memberships" value={stats.expired} />
        <Stat icon={<UserPlus className="h-4 w-4" />} label="New Valuable Members" value={stats.newInRange} />
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, business, or mobile"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <DateRangeField label="Joining Date" from={joiningFrom} to={joiningTo} onFromChange={setJoiningFrom} onToChange={setJoiningTo} />
          <DateRangeField label="Valid Through" from={validFrom} to={validTo} onFromChange={setValidFrom} onToChange={setValidTo} />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Invited By</span>
            <MemberFilterCombobox
              label="Invited By"
              value={inviterFilter}
              onChange={setInviterFilter}
              options={inviterOptions}
              className="w-full sm:w-[220px] h-9"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
              <FilterX className="h-4 w-4 mr-1.5" /> Clear
            </Button>
          )}
        </div>
        {!isLoading && (
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {members.length} Valuable Members
          </p>
        )}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading Valuable Members...
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-destructive text-sm mb-3">Couldn't load Valuable Members.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No Valuable Members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Profile</TableHead>
                  <TableHead className="min-w-[160px]">Member Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Business Name</TableHead>
                  <TableHead className="hidden md:table-cell">Mobile Number</TableHead>
                  <TableHead className="hidden lg:table-cell">Joining Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Valid Through</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const status = getMembershipStatus(m.paid_valid_through);
                  return (
                    <TableRow key={m.member_id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={m.profile_picture ?? undefined} />
                          <AvatarFallback className="text-xs">{initials(m.full_name)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{m.full_name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {m.business_name || "Not Available"}
                        </div>
                        <div className="text-xs text-muted-foreground md:hidden">{m.phone || "Not Available"}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {m.business_name || "Not Available"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {m.phone || "Not Available"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDateOrNA(m.paid_joining_date)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatDateOrNA(m.paid_valid_through)}
                      </TableCell>
                      <TableCell>
                        <MembershipStatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {/* <DropdownMenuItem
                              onClick={() => navigate(`/admin/valuable-members/${m.member_id}/profile`)}
                            >
                              <User className="h-4 w-4 mr-2" /> View Profile
                            </DropdownMenuItem> */}
                            <DropdownMenuItem
                              onClick={() => navigate(`/admin/valuable-members/${m.member_id}/details`)}
                            >
                              <FileText className="h-4 w-4 mr-2" /> Membership Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingMember(m)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit Membership
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem
                              onClick={() => navigate(`/admin/valuable-members/${m.member_id}/renew`)}
                            >
                              <RefreshCcw className="h-4 w-4 mr-2" /> Renew Membership
                            </DropdownMenuItem> */}
                            <DropdownMenuSeparator />
                            {/* <DropdownMenuItem
                              onClick={() => navigate(`/admin/valuable-members/${m.member_id}/activity`)}
                            >
                              <Activity className="h-4 w-4 mr-2" /> Activity
                            </DropdownMenuItem> */}
                            <DropdownMenuItem
                              onClick={() => navigate(`/admin/valuable-members/${m.member_id}/attendance`)}
                            >
                              <CalendarCheck2 className="h-4 w-4 mr-2" /> Attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/admin/valuable-members/${m.member_id}/qr-code`)}
                            >
                              <QrCode className="h-4 w-4 mr-2" /> QR Code
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <ConvertToPaidMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        member={null}
        roster={roster}
        allowVisitorPicker
        defaultJoiningDateToday
        onSuccess={() => {
          refetch();
          refetchRoster();
        }}
      />

      <ConvertToPaidMemberDialog
        open={!!editingMember}
        onOpenChange={(o) => !o && setEditingMember(null)}
        member={editingMember}
        roster={roster}
        onSuccess={() => {
          refetch();
          refetchRoster();
        }}
      />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="text-xl font-display font-bold text-foreground mt-1">{value}</p>
    </Card>
  );
}
