import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useActiveMembers, useCreateLead } from "@/hooks/useLeads";

const schema = z.object({
  receiver_id: z.string().uuid("Select a member"),
  lead_name: z.string().trim().min(2, "At least 2 characters").max(100),
  contact_number: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s\-()]{6,18}$/i, "Enter a valid contact number"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]),
});

type FormData = z.infer<typeof schema>;

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
  const { data: members = [], isLoading: membersLoading } = useActiveMembers();
  const createLead = useCreateLead();
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
    defaultValues: { priority: "medium" },
  });

  const selectedReceiver = watch("receiver_id");
  const selectedMember = members.find((m) => m.user_id === selectedReceiver);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members.slice(0, 30);
    return members
      .filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.business?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [members, search]);

  const onSubmit = async (data: FormData) => {
    try {
      await createLead.mutateAsync({
        giver_id: giverId,
        receiver_id: data.receiver_id,
        lead_name: data.lead_name,
        contact_number: data.contact_number,
        description: data.description || undefined,
        priority: data.priority,
      });
      toast({ title: "Lead shared", description: "The member has been notified." });
      reset();
      setSearch("");
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Could not create lead", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { reset(); setSearch(""); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share a new lead</DialogTitle>
          <DialogDescription>
            Refer business to a fellow REN member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Assign to member</Label>
            {selectedMember ? (
              <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selectedMember.avatar_url ?? undefined} />
                    <AvatarFallback>{initials(selectedMember.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selectedMember.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedMember.business} · {selectedMember.city}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setValue("receiver_id", "" as any)}>
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
                  ) : filtered.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No members found</div>
                  ) : (
                    filtered.map((m) => (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => setValue("receiver_id", m.user_id, { shouldValidate: true })}
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
            {errors.receiver_id && (
              <p className="text-xs text-destructive">{errors.receiver_id.message}</p>
            )}
          </div>

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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createLead.isPending}>
              {createLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Share Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
