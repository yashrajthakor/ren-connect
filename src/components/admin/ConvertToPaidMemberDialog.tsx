import { useEffect, useMemo, useState } from "react";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";

export interface RosterMember {
  member_id: string;
  full_name: string;
  business_name?: string | null;
  phone?: string | null;
  status?: string | null;
  // Loosely typed (not a strict union) so hosts whose own member type just
  // declares `string | null` (e.g. Valuable Members) remain assignable here.
  membership_type?: string | null;
  invited_by_member_id?: string | null;
  paid_joining_date?: string | null;
  paid_valid_through?: string | null;
}

export interface PaidMemberConversionResult {
  member_id: string;
  invited_by_member_id: string;
  invited_by_name: string;
  paid_joining_date: string;
  paid_valid_through: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Pre-selected target — the Members page's per-row Select flow already
   * knows which member is being converted/edited. Pass `null` together with
   * `allowVisitorPicker` to let the dialog present its own searchable
   * Visitor dropdown first (the "+ New Valuable Member" flow).
   */
  member: RosterMember | null;
  /** Full member roster (Visitors + Paid Members) to search over. */
  roster: RosterMember[];
  /** Show an internal searchable Visitor picker when no `member` is pre-selected. */
  allowVisitorPicker?: boolean;
  /** Default Joining Date to today for a brand-new conversion with no existing date. */
  defaultJoiningDateToday?: boolean;
  onSuccess: (result: PaidMemberConversionResult) => void;
}

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

/** Sentinel for "no inviter" — founding members / direct joins. Saved as NULL. */
const NONE_SELF = "none";

function matches(m: RosterMember, q: string): boolean {
  if (!q) return true;
  return (
    m.full_name?.toLowerCase().includes(q) ||
    (m.business_name || "").toLowerCase().includes(q) ||
    (m.phone || "").toLowerCase().includes(q)
  );
}

/**
 * Reusable Visitor → Paid Member conversion / Paid Member details editor.
 * Shared by Admin → Members (pre-selected member) and Admin → Valuable
 * Members ("+ New Valuable Member", picks its own Visitor) so both pages
 * use the exact same validation, API calls and success/error handling.
 */
export default function ConvertToPaidMemberDialog({
  open,
  onOpenChange,
  member,
  roster,
  allowVisitorPicker,
  defaultJoiningDateToday,
  onSuccess,
}: Props) {
  const { toast } = useToast();

  const [pickedVisitor, setPickedVisitor] = useState<RosterMember | null>(null);
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorComboOpen, setVisitorComboOpen] = useState(false);

  const [selectedInviterId, setSelectedInviterId] = useState<string>(NONE_SELF);
  const [inviterSearch, setInviterSearch] = useState("");
  const [inviterComboOpen, setInviterComboOpen] = useState(false);

  const [joiningDate, setJoiningDate] = useState<string>("");
  const [validThrough, setValidThrough] = useState<string>("");
  const [converting, setConverting] = useState(false);

  const targetMember = member ?? pickedVisitor;
  const isNewConversionFlow = allowVisitorPicker && !member;
  const isEditingInviterOnly = (targetMember?.membership_type || "visitor") === "paid_member";

  // (Re)seed all fields whenever the dialog opens or the pre-selected
  // member changes — matches how the Members page reset state on open.
  useEffect(() => {
    if (!open) return;
    setPickedVisitor(null);
    setVisitorSearch("");
    setInviterSearch("");
    const todayStr = toDateInputValue(new Date());
    if (member) {
      setSelectedInviterId(member.invited_by_member_id || NONE_SELF);
      const seededJoin = member.paid_joining_date || (defaultJoiningDateToday ? todayStr : "");
      setJoiningDate(seededJoin);
      setValidThrough(member.paid_valid_through || (seededJoin ? computeValidThrough(seededJoin) : ""));
    } else {
      setSelectedInviterId(NONE_SELF);
      const seededJoin = defaultJoiningDateToday ? todayStr : "";
      setJoiningDate(seededJoin);
      setValidThrough(seededJoin ? computeValidThrough(seededJoin) : "");
    }
  }, [open, member, defaultJoiningDateToday]);

  const visitors = useMemo(
    () => roster.filter((x) => (x.membership_type || "visitor") === "visitor" && x.status === "active"),
    [roster]
  );
  const filteredVisitors = useMemo(() => {
    const q = visitorSearch.trim().toLowerCase();
    return (q ? visitors.filter((x) => matches(x, q)) : visitors).slice(0, 30);
  }, [visitors, visitorSearch]);

  const activePaidMembers = useMemo(
    () =>
      roster.filter(
        (x) =>
          (x.membership_type || "visitor") === "paid_member" &&
          x.status === "active" &&
          x.member_id !== targetMember?.member_id
      ),
    [roster, targetMember]
  );
  const filteredInviters = useMemo(() => {
    const q = inviterSearch.trim().toLowerCase();
    return (q ? activePaidMembers.filter((x) => matches(x, q)) : activePaidMembers).slice(0, 30);
  }, [activePaidMembers, inviterSearch]);

  const selectedInviter = activePaidMembers.find((x) => x.member_id === selectedInviterId);
  // Invited By is optional — selectedInviterId is always either a real
  // member id or the NONE_SELF sentinel, never empty, so it never blocks save.
  const detailsIncomplete = !targetMember || !joiningDate || !validThrough;

  const close = () => {
    if (converting) return;
    onOpenChange(false);
  };

  const confirmConvert = async () => {
    if (!targetMember || detailsIncomplete) return;
    setConverting(true);
    const invitedByToSave = selectedInviterId === NONE_SELF ? null : selectedInviterId;
    const { error } = isEditingInviterOnly
      ? await (supabase as any).rpc("set_paid_member_details", {
          _member_id: targetMember.member_id,
          _invited_by_member_id: invitedByToSave,
          _joining_date: joiningDate,
          _valid_through: validThrough,
        })
      : await (supabase as any).rpc("set_membership_type", {
          _member_id: targetMember.member_id,
          _type: "paid_member",
          _invited_by_member_id: invitedByToSave,
          _joining_date: joiningDate,
          _valid_through: validThrough,
        });
    setConverting(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    const inviterName = selectedInviter?.full_name || "None / Self";
    if (isNewConversionFlow) {
      toast({ title: "✅ Valuable Member added successfully.", description: targetMember.full_name });
    } else if (isEditingInviterOnly) {
      toast({ title: "Paid Member details updated", description: targetMember.full_name });
    } else {
      toast({
        title: "Membership updated",
        description: `${targetMember.full_name} → Paid Member (invited by ${inviterName})`,
      });
    }
    onSuccess({
      member_id: targetMember.member_id,
      invited_by_member_id: invitedByToSave || "",
      invited_by_name: invitedByToSave ? inviterName : "",
      paid_joining_date: joiningDate,
      paid_valid_through: validThrough,
    });
    onOpenChange(false);
  };

  const title = isNewConversionFlow
    ? "New Valuable Member"
    : isEditingInviterOnly
    ? "Paid Member Details"
    : "Convert to Paid Member";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isNewConversionFlow ? (
              "Select a Visitor and record the Invited By, Joining Date and Valid Through to convert them into a Valuable Member."
            ) : (
              targetMember && (
                <>
                  {isEditingInviterOnly ? "Update" : "Record"} the Invited By, Joining Date and Valid Through for{" "}
                  <strong>{targetMember.full_name}</strong>
                  {isEditingInviterOnly ? "." : " to complete the upgrade."}
                </>
              )
            )}
          </DialogDescription>
        </DialogHeader>

        {isNewConversionFlow && (
          <div className="space-y-2">
            <Label>Visitor</Label>
            <Popover open={visitorComboOpen} onOpenChange={setVisitorComboOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={visitorComboOpen}
                  className="w-full flex items-center justify-between gap-2 border rounded-lg p-3 text-left hover:bg-muted/40 transition-colors"
                >
                  {pickedVisitor ? (
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{pickedVisitor.full_name}</p>
                      {(pickedVisitor.business_name || pickedVisitor.phone) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[pickedVisitor.business_name, pickedVisitor.phone].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Search by name, business, or mobile…</span>
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by name, business, or mobile..."
                    value={visitorSearch}
                    onValueChange={setVisitorSearch}
                  />
                  <CommandList className="max-h-56">
                    <CommandEmpty>No Visitors found</CommandEmpty>
                    <CommandGroup>
                      {filteredVisitors.map((x) => (
                        <CommandItem
                          key={x.member_id}
                          value={x.member_id}
                          onSelect={() => {
                            setPickedVisitor(x);
                            setVisitorComboOpen(false);
                            setVisitorSearch("");
                          }}
                          className="flex items-center gap-2 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{x.full_name}</p>
                            {(x.business_name || x.phone) && (
                              <p className="text-xs text-muted-foreground truncate">
                                {[x.business_name, x.phone].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                          {pickedVisitor?.member_id === x.member_id && (
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
        )}

        <div className="space-y-2">
          <Label>Invited By</Label>
          <Popover open={inviterComboOpen} onOpenChange={setInviterComboOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-expanded={inviterComboOpen}
                disabled={!targetMember}
                className="w-full flex items-center justify-between gap-2 border rounded-lg p-3 text-left hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedInviter ? (
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{selectedInviter.full_name}</p>
                    {selectedInviter.business_name && (
                      <p className="text-xs text-muted-foreground truncate">{selectedInviter.business_name}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-foreground">None / Self</span>
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
                  <CommandGroup>
                    <CommandItem
                      value={NONE_SELF}
                      onSelect={() => {
                        setSelectedInviterId(NONE_SELF);
                        setInviterComboOpen(false);
                        setInviterSearch("");
                      }}
                      className="flex items-center gap-2 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">None / Self</p>
                        <p className="text-xs text-muted-foreground truncate">Founding member or joined directly</p>
                      </div>
                      {selectedInviterId === NONE_SELF && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </CommandItem>
                  </CommandGroup>
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
                        {selectedInviterId === x.member_id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">Optional — defaults to None / Self.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="cvt-joining-date">Joining Date</Label>
            <Input
              id="cvt-joining-date"
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
            <Label htmlFor="cvt-valid-through">Valid Through</Label>
            <Input
              id="cvt-valid-through"
              type="date"
              value={validThrough}
              min={joiningDate || undefined}
              onChange={(e) => setValidThrough(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Auto-set to 1 year from Joining Date — editable.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={converting}>
            Cancel
          </Button>
          <Button variant="royal" onClick={confirmConvert} disabled={converting || detailsIncomplete}>
            {converting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isNewConversionFlow ? "Save" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
