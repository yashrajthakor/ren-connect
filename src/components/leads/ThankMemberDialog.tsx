import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Loader2, Heart, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useActiveMembers, useCreateDirectBusinessThanks, useCurrentUserId } from "@/hooks/useLeads";
import { friendlyError } from "@/lib/errors";
import { DRAFT_KEYS, readFormDraft, writeFormDraft, clearFormDraft } from "@/lib/formDraft";

const schema = z.object({
  giver_id: z.string({ required_error: "Select a member to appreciate" }).uuid("Select a member to appreciate"),
  amount: z.coerce
    .number({ invalid_type_error: "Enter the business amount" })
    .positive("Amount must be greater than zero")
    .max(99999999999, "Amount is too large"),
  description: z.string().trim().min(2, "Add a short title").max(200),
  thank_you_note: z.string().trim().min(5, "Add a thank you note").max(500),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function initials(name: string) {
  return (name || "?")
    .split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function ThankMemberDialog({ open, onOpenChange }: Props) {
  const [search, setSearch] = useState("");
  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useActiveMembers();
  const { data: currentUserId } = useCurrentUserId();
  const createThanks = useCreateDirectBusinessThanks();
  const { toast } = useToast();

  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Restore an unfinished draft when the dialog opens (survives the app being
  // backgrounded/reloaded while the user copies details from another app).
  useEffect(() => {
    if (!open) return;
    const draft = readFormDraft<Partial<FormData>>(DRAFT_KEYS.thankMember);
    if (draft) reset(draft);
  }, [open, reset]);

  // Keep the draft in sync while the user types.
  useEffect(() => {
    if (!open) return;
    const sub = watch((values) => {
      const hasContent =
        values.giver_id ||
        values.amount ||
        values.description?.trim() ||
        values.thank_you_note?.trim();
      if (hasContent) writeFormDraft(DRAFT_KEYS.thankMember, values);
      else clearFormDraft(DRAFT_KEYS.thankMember);
    });
    return () => sub.unsubscribe();
  }, [open, watch]);

  const selectedId = watch("giver_id");

  // You can't thank yourself for business.
  const selectable = useMemo(
    () => members.filter((m) => m.user_id !== currentUserId),
    [members, currentUserId]
  );
  const selectedMember = selectable.find((m) => m.user_id === selectedId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return selectable.slice(0, 30);
    return selectable
      .filter((m) =>
        m.name?.toLowerCase().includes(q) ||
        m.business?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [selectable, search]);

  const busy = isSubmitting || createThanks.isPending;

  const onSubmit = async (data: FormData) => {
    if (busy) return; // guard against double submission
    if (currentUserId && data.giver_id === currentUserId) {
      toast({
        title: "Invalid member",
        description: "You cannot thank yourself.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createThanks.mutateAsync({
        giver_id: data.giver_id,
        amount: Number(data.amount),
        description: data.description,
        thank_you_note: data.thank_you_note,
      });
      toast({
        title: "Appreciation sent",
        description: `${selectedMember?.name || "The member"} has been notified.`,
      });
      clearFormDraft(DRAFT_KEYS.thankMember);
      reset({});
      setSearch("");
      onOpenChange(false);
    } catch (e) {
      // Keep the dialog open with all input intact so the user can retry.
      toast({
        title: "Could not record appreciation",
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
        if (!v) { clearFormDraft(DRAFT_KEYS.thankMember); reset({}); setSearch(""); }
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-4 w-4 fill-primary" />
            </span>
            <div>
              <DialogTitle>Thank a Member</DialogTitle>
              <DialogDescription className="text-xs">
                Record business that came through a fellow RBN member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Member who helped you</Label>
            {selectedMember ? (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-primary/5 border-primary/30">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selectedMember.avatar_url ?? undefined} />
                    <AvatarFallback>{initials(selectedMember.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selectedMember.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedMember.business} {selectedMember.city ? `· ${selectedMember.city}` : ""}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setValue("giver_id", "" as any)}>
                  Change
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, business, city..."
                    className="pl-9 h-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
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
                  ) : filtered.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No members found</div>
                  ) : (
                    filtered.map((m) => (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => setValue("giver_id", m.user_id, { shouldValidate: true })}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={m.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {m.business} {m.city ? `· ${m.city}` : ""}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
            {errors.giver_id && <p className="text-xs text-destructive">{errors.giver_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Business amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min={1}
              step="0.01"
              placeholder="e.g. 50000"
              {...register("amount")}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Business title / description</Label>
            <Input
              id="description"
              placeholder="e.g. Website Development Project"
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="thank_you_note" className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Thank you note
            </Label>
            <Textarea
              id="thank_you_note"
              rows={4}
              placeholder="Write a thank you note to appreciate the member support…"
              {...register("thank_you_note")}
            />
            {errors.thank_you_note && <p className="text-xs text-destructive">{errors.thank_you_note.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                clearFormDraft(DRAFT_KEYS.thankMember);
                onOpenChange(false);
                reset({});
                setSearch("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              {busy ? "Sending…" : "Send Appreciation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}