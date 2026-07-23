import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { useActiveMembers, useCreateLead, useMyLeadProfile } from "@/hooks/useLeads";
import { friendlyError } from "@/lib/errors";
import { DRAFT_KEYS, readFormDraft, writeFormDraft, clearFormDraft } from "@/lib/formDraft";

const schema = z.object({
  receiver_id: z.string({ required_error: "Select a member" }).uuid("Select a member"),
  lead_type: z.enum(["internal", "external"]),
  lead_name: z.string().trim().min(2, "At least 2 characters").max(100),
  contact_number: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^[+\d][\d\s\-()]{6,18}$/i.test(val),
      "Enter a valid contact number"
    ),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]),
});

type FormData = z.infer<typeof schema>;

const defaultFormValues: Partial<FormData> = { lead_type: "internal", priority: "medium" };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  giverId: string;
}

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CreateLeadDialog({ open, onOpenChange, giverId }: Props) {
  const [search, setSearch] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useActiveMembers();
  const createLead = useCreateLead();
  const { data: myProfile, isLoading: myProfileLoading } = useMyLeadProfile(giverId);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultFormValues,
  });

  // Restore an unfinished draft when the dialog opens (survives the app being
  // backgrounded/reloaded while the user copies details from another app).
  useEffect(() => {
    if (!open) return;
    const draft = readFormDraft<Partial<FormData>>(DRAFT_KEYS.createLead);
    if (draft) reset({ ...defaultFormValues, ...draft });
  }, [open, reset]);

  // Keep the draft in sync while the user types.
  useEffect(() => {
    if (!open) return;
    const sub = watch((values) => {
      const hasContent =
        values.receiver_id ||
        values.lead_name?.trim() ||
        values.contact_number?.trim() ||
        values.description?.trim();
      if (hasContent) writeFormDraft(DRAFT_KEYS.createLead, values);
      else clearFormDraft(DRAFT_KEYS.createLead);
    });
    return () => sub.unsubscribe();
  }, [open, watch]);

  const selectedReceiver = watch("receiver_id");
  const leadType = watch("lead_type");
  const isInternal = leadType === "internal";

  // Internal: Lead Name / Contact Number always mirror the giver's own
  // profile — never user-editable. Re-apply whenever the profile loads or
  // the user switches back to Internal.
  useEffect(() => {
    if (!open || !isInternal || !myProfile) return;
    setValue("lead_name", myProfile.full_name || "", { shouldValidate: true });
    setValue("contact_number", myProfile.phone || "", { shouldValidate: true });
  }, [open, isInternal, myProfile, setValue]);

  // External: clear the auto-filled values so the user starts with a blank
  // slate for the external customer's own details.
  const prevLeadType = useRef(leadType);
  useEffect(() => {
    if (prevLeadType.current !== leadType) {
      if (leadType === "external") {
        setValue("lead_name", "");
        setValue("contact_number", "");
      }
      prevLeadType.current = leadType;
    }
  }, [leadType, setValue]);

  // A member can't be assigned a lead by themselves.
  const selectable = useMemo(
    () => members.filter((m) => m.user_id !== giverId),
    [members, giverId]
  );
  const selectedMember = selectable.find((m) => m.user_id === selectedReceiver);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return selectable.slice(0, 30);
    return selectable
      .filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.business?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [selectable, search]);

  // Internal leads need the giver's own profile to have a usable name — if
  // it's missing there's nothing meaningful to auto-fill.
  const profileIncomplete =
    isInternal && !myProfileLoading && (!myProfile?.full_name || myProfile.full_name.trim().length < 2);

  const busy = isSubmitting || createLead.isPending;

  const resetForm = () => {
    reset(defaultFormValues);
    setSearch("");
    setComboOpen(false);
  };

  const onSubmit = async (data: FormData) => {
    if (busy) return; // guard against double submission
    if (data.receiver_id === giverId) {
      toast({
        title: "Invalid member",
        description: "You cannot assign a lead to yourself.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createLead.mutateAsync({
        giver_id: giverId,
        receiver_id: data.receiver_id,
        lead_name: data.lead_name,
        contact_number: data.contact_number || "",
        description: data.description || undefined,
        priority: data.priority,
        lead_type: data.lead_type,
      });
      toast({ title: "Lead shared", description: "The member has been notified." });
      clearFormDraft(DRAFT_KEYS.createLead);
      resetForm();
      onOpenChange(false);
    } catch (e) {
      // Keep the dialog open with all input intact so the user can retry.
      toast({
        title: "Could not create lead",
        description: friendlyError(e, "Something went wrong. Your details are kept — please try again."),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && busy) return; // don't allow closing while a submission is in flight
        onOpenChange(v);
        // Explicit close (X / outside tap / Esc): discard the draft.
        if (!v) { clearFormDraft(DRAFT_KEYS.createLead); resetForm(); }
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share a new lead</DialogTitle>
          <DialogDescription>
            Refer business to a fellow RBN member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Assign to member</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full flex items-center justify-between gap-2 border rounded-lg p-3 text-left hover:bg-muted/40 transition-colors"
                >
                  {selectedMember ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={selectedMember.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{initials(selectedMember.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{selectedMember.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedMember.business} {selectedMember.city ? `· ${selectedMember.city}` : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Search by name, business, or city…</span>
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by name, business, city..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList className="max-h-56">
                    {membersLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>
                    ) : membersError ? (
                      <div className="p-4 text-center text-sm">
                        <p className="text-destructive">Couldn't load members.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => refetchMembers()}
                        >
                          Try again
                        </Button>
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>No members found</CommandEmpty>
                        <CommandGroup>
                          {filtered.map((m) => (
                            <CommandItem
                              key={m.user_id}
                              value={m.user_id}
                              onSelect={() => {
                                setValue("receiver_id", m.user_id, { shouldValidate: true });
                                setComboOpen(false);
                                setSearch("");
                              }}
                              className="flex items-center gap-3 py-2"
                            >
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage src={m.avatar_url ?? undefined} />
                                <AvatarFallback className="text-[10px]">{initials(m.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{m.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {m.business} {m.city ? `· ${m.city}` : ""}
                                </p>
                              </div>
                              {selectedReceiver === m.user_id && (
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.receiver_id && (
              <p className="text-xs text-destructive">{errors.receiver_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Lead Type</Label>
            <ToggleGroup
              type="single"
              value={leadType}
              onValueChange={(v) => {
                if (v) setValue("lead_type", v as FormData["lead_type"], { shouldValidate: true });
              }}
              className="grid grid-cols-2 gap-2"
            >
              <ToggleGroupItem
                value="internal"
                className="border data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              >
                Internal Lead
              </ToggleGroupItem>
              <ToggleGroupItem
                value="external"
                className="border data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              >
                External Lead
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {isInternal ? (
            <div className="space-y-2">
              <Label>Lead Source (You)</Label>
              <div className="rounded-lg border bg-muted/30 p-3">
                {myProfileLoading ? (
                  <p className="text-sm text-muted-foreground">Loading your profile…</p>
                ) : (
                  <>
                    <p className="font-medium text-sm truncate">{myProfile?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {myProfile?.phone || "No phone number on file"}
                    </p>
                  </>
                )}
              </div>
              {profileIncomplete ? (
                <p className="flex items-start gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Your profile is missing a name. Update it in My Profile before sharing an internal lead.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Your profile details are used automatically as the lead contact.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="lead_name">Lead name</Label>
                <Input id="lead_name" placeholder="e.g. Anil Mehta" {...register("lead_name")} />
                {errors.lead_name && <p className="text-xs text-destructive">{errors.lead_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact number</Label>
                <Input id="contact_number" placeholder="+91 98xxx xxxxx" {...register("contact_number")} />
                {errors.contact_number && <p className="text-xs text-destructive">{errors.contact_number.message}</p>}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Lead description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="What is this lead about?"
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                clearFormDraft(DRAFT_KEYS.createLead);
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || profileIncomplete}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Sharing…" : "Share Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
