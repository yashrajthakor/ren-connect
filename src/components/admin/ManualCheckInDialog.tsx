import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, CheckCircle2, Clock, Star, UserPlus, ArrowLeft, ChevronsUpDown, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useValuableMembers } from "@/hooks/useValuableMembers";
import {
  useMarkAttendance,
  useAdminAddAttendance,
  useAllMembersForAttendanceSearch,
  useCreateVisitorAndCheckIn,
  type AttendanceType,
  type AttendanceSearchMember,
} from "@/hooks/useAttendanceMeetings";
import { useToast } from "@/hooks/use-toast";
import { nowForDatetimeLocalInput } from "@/lib/attendanceFormat";

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function matchesQuery(m: AttendanceSearchMember, q: string): boolean {
  if (!q) return true;
  return (
    m.full_name?.toLowerCase().includes(q) ||
    (m.business_name || "").toLowerCase().includes(q) ||
    (m.phone || "").toLowerCase().includes(q)
  );
}

function MembershipBadge({ membershipType }: { membershipType?: string | null }) {
  if (membershipType === "paid_member") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary shrink-0">
        <Star className="h-3 w-3 fill-primary" /> Valuable Member
      </span>
    );
  }
  return <span className="text-[10px] font-semibold text-muted-foreground shrink-0">Visitor</span>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  presentMemberIds: Set<string>;
  onCheckedIn?: (memberName: string) => void;
  /** "live" (default) uses the live-scan check-in path, gated to a Live meeting.
   * "edit" uses the admin correction path, which works regardless of meeting status. */
  mode?: "live" | "edit";
}

export default function ManualCheckInDialog({
  open,
  onOpenChange,
  meetingId,
  presentMemberIds,
  onCheckedIn,
  mode = "live",
}: Props) {
  const { toast } = useToast();
  const [attendanceAs, setAttendanceAs] = useState<AttendanceType>("valuable_member");
  const [search, setSearch] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState("");

  const [addingNew, setAddingNew] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [referredById, setReferredById] = useState("");
  const [referredSearch, setReferredSearch] = useState("");
  const [referredComboOpen, setReferredComboOpen] = useState(false);
  const [savingNewVisitor, setSavingNewVisitor] = useState(false);

  const { data: valuableMembers = [], isLoading: loadingValuable } = useValuableMembers(
    open && attendanceAs === "valuable_member"
  );
  const { data: allMembers = [], isLoading: loadingAll } = useAllMembersForAttendanceSearch(
    open && attendanceAs === "visitor"
  );
  const markAttendance = useMarkAttendance();
  const adminAddAttendance = useAdminAddAttendance();
  const createVisitor = useCreateVisitorAndCheckIn();

  useEffect(() => {
    if (!open) return;
    setAttendanceAs("valuable_member");
    setSearch("");
    setAddingNew(false);
    setNewFullName("");
    setNewPhone("");
    setNewBusinessName("");
    setNewCity("");
    setReferredById("");
    setReferredSearch("");
    if (mode === "edit") setCheckInTime(nowForDatetimeLocalInput());
  }, [open, mode]);

  const members: AttendanceSearchMember[] = useMemo(() => {
    if (attendanceAs === "valuable_member") {
      return valuableMembers.map((m) => ({
        member_id: m.member_id,
        full_name: m.full_name,
        business_name: m.business_name,
        phone: m.phone,
        profile_picture: m.profile_picture,
        membership_type: "paid_member",
      }));
    }
    return allMembers;
  }, [attendanceAs, valuableMembers, allMembers]);
  const isLoading = attendanceAs === "valuable_member" ? loadingValuable : loadingAll;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => matchesQuery(m, q));
  }, [members, search]);

  const filteredReferrers = useMemo(() => {
    const q = referredSearch.trim().toLowerCase();
    return (q ? allMembers.filter((m) => matchesQuery(m, q)) : allMembers).slice(0, 30);
  }, [allMembers, referredSearch]);
  const selectedReferrer = allMembers.find((m) => m.member_id === referredById);

  const markPresent = async (memberId: string, memberName: string) => {
    setMarkingId(memberId);
    try {
      const result =
        mode === "edit"
          ? await adminAddAttendance.mutateAsync({
              meetingId,
              memberId,
              checkInTime: checkInTime ? new Date(checkInTime).toISOString() : null,
              attendanceType: attendanceAs,
            })
          : await markAttendance.mutateAsync({ meetingId, memberId, method: "manual", attendanceType: attendanceAs });
      if (result.duplicate) {
        toast({ title: `${memberName} is already checked in.` });
      } else {
        toast({ title: `✅ ${memberName} checked in successfully.` });
        onCheckedIn?.(memberName);
      }
    } catch (e: any) {
      toast({ title: "Check-in failed", description: e.message, variant: "destructive" });
    } finally {
      setMarkingId(null);
    }
  };

  const startAddNew = () => {
    setNewFullName(search.trim());
    setAddingNew(true);
  };

  const saveNewVisitor = async () => {
    const trimmedName = newFullName.trim();
    if (!trimmedName || !referredById) return;
    setSavingNewVisitor(true);
    try {
      const result = await createVisitor.mutateAsync({
        meetingId,
        fullName: trimmedName,
        phone: newPhone.trim() || null,
        businessName: newBusinessName.trim() || null,
        city: newCity.trim() || null,
        referredByMemberId: referredById,
        checkInTime: mode === "edit" && checkInTime ? new Date(checkInTime).toISOString() : null,
      });
      toast({ title: `✅ ${result.member_name} checked in successfully.` });
      onCheckedIn?.(result.member_name);
      setAddingNew(false);
      setNewFullName("");
      setNewPhone("");
      setNewBusinessName("");
      setNewCity("");
      setReferredById("");
      setReferredSearch("");
      setSearch("");
    } catch (e: any) {
      toast({ title: "Couldn't add visitor", description: e.message, variant: "destructive" });
    } finally {
      setSavingNewVisitor(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{addingNew ? "Add New Visitor" : "Manual Check-in"}</DialogTitle>
          <DialogDescription>
            {addingNew
              ? "Create a new Visitor and mark them present for this meeting."
              : attendanceAs === "visitor"
                ? "Search includes current Visitors and current Valuable Members."
                : "Search a Valuable Member by name, business, or mobile number."}
          </DialogDescription>
        </DialogHeader>

        {addingNew ? (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" className="-ml-2 -mt-1 w-fit" onClick={() => setAddingNew(false)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to search
            </Button>

            <div>
              <Label>Full Name *</Label>
              <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mobile Number</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <Label>Business Name</Label>
                <Input
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <Label>City</Label>
              <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Optional" />
            </div>

            <div>
              <Label>Referred By *</Label>
              <Popover open={referredComboOpen} onOpenChange={setReferredComboOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={referredComboOpen}
                    className="w-full flex items-center justify-between gap-2 border rounded-lg p-3 text-left hover:bg-muted/40 transition-colors"
                  >
                    {selectedReferrer ? (
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{selectedReferrer.full_name}</p>
                        {selectedReferrer.business_name && (
                          <p className="text-xs text-muted-foreground truncate">{selectedReferrer.business_name}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Search by name or business…</span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by name or business..."
                      value={referredSearch}
                      onValueChange={setReferredSearch}
                    />
                    <CommandList className="max-h-56">
                      <CommandEmpty>No members found</CommandEmpty>
                      <CommandGroup>
                        {filteredReferrers.map((x) => (
                          <CommandItem
                            key={x.member_id}
                            value={x.member_id}
                            onSelect={() => {
                              setReferredById(x.member_id);
                              setReferredComboOpen(false);
                              setReferredSearch("");
                            }}
                            className="flex items-center gap-2 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{x.full_name}</p>
                              {x.business_name && (
                                <p className="text-xs text-muted-foreground truncate">{x.business_name}</p>
                              )}
                            </div>
                            {referredById === x.member_id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              variant="royal"
              className="w-full"
              disabled={savingNewVisitor || !newFullName.trim() || !referredById}
              onClick={saveNewVisitor}
            >
              {savingNewVisitor && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save &amp; Check In
            </Button>
          </div>
        ) : (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Attendance As</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAttendanceAs("valuable_member")}
                  className={`rounded-lg border p-2 text-sm font-semibold transition-colors ${
                    attendanceAs === "valuable_member"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  Valuable Member
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceAs("visitor")}
                  className={`rounded-lg border p-2 text-sm font-semibold transition-colors ${
                    attendanceAs === "visitor"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  Visitor
                </button>
              </div>
            </div>

            {mode === "edit" && (
              <div>
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5" /> Check-in Time
                </Label>
                <Input type="datetime-local" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, business, or mobile"
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-80 overflow-y-auto -mx-1 px-1 space-y-1">
              {isLoading ? (
                <div className="p-8 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading members...
                </div>
              ) : (
                <>
                  {filtered.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      {attendanceAs === "valuable_member" ? "No Valuable Members found." : "No members found."}
                    </div>
                  )}
                  {filtered.map((m) => {
                    const isPresent = presentMemberIds.has(m.member_id);
                    return (
                      <div
                        key={m.member_id}
                        className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-muted/50"
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={m.profile_picture ?? undefined} />
                          <AvatarFallback className="text-xs">{initials(m.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{m.full_name}</span>
                            <MembershipBadge membershipType={m.membership_type} />
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {m.business_name || "Not Available"} · {m.phone || "Not Available"}
                          </div>
                        </div>
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="h-4 w-4" /> Present
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="royal"
                            className="shrink-0"
                            disabled={markingId === m.member_id}
                            onClick={() => markPresent(m.member_id, m.full_name)}
                          >
                            {markingId === m.member_id && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                            Mark Present
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {attendanceAs === "visitor" && (
                    <button
                      type="button"
                      onClick={startAddNew}
                      className="w-full flex items-center gap-2 rounded-lg border border-dashed border-primary/40 p-2.5 text-primary hover:bg-primary/5 transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="text-sm font-medium">+ Add New Visitor</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
