import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useAllSponsors,
  useSponsorMutations,
  type SponsorRow,
  type SponsorInput,
} from "@/hooks/useSponsors";
import { supabase } from "@/integrations/supabase/client";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Building2,
  Upload,
} from "lucide-react";
import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || z.string().url().safeParse(v).success, "Website must be a valid URL")
  .transform((v) => (v === "" ? null : v));

const SPONSORSHIP_TYPES = [
  "Title Sponsor",
  "Diary Sponsor",
  "Pen Sponsor",
  "Badge Sponsor",
  "Lunch Sponsor",
  "Tea Sponsor",
  "Venue Sponsor",
  "Gold Sponsor",
  "Silver Sponsor",
  "Event Sponsor",
  "Technology Partner",
];

const schema = z.object({
  logo_url: z.string().url("Logo must be a valid URL").min(1, "Logo URL is required"),
  firm_name: z.string().min(2, "Firm name is required").max(120),
  owner_name: z.string().min(2, "Owner name is required").max(120),
  tagline: z.string().max(240),
  website: optionalUrl.nullable(),
  sponsorship_type: z.string().trim().min(2, "Sponsorship type is required").max(60),
  contact_number: z
    .string()
    .trim()
    .max(20, "Contact number is too long")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  display_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

const emptyForm = (order = 0): SponsorInput => ({
  logo_url: "",
  firm_name: "",
  owner_name: "",
  tagline: "",
  website: null,
  sponsorship_type: "Event Sponsor",
  contact_number: null,
  display_order: order,
  is_active: true,
});

export default function AdminSponsorsPage() {
  const { toast } = useToast();
  const { data: sponsors = [], isLoading } = useAllSponsors(true);
  const { create, update, remove } = useSponsorMutations();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<SponsorRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SponsorInput>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<SponsorRow | null>(null);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(sponsors.length + 1));
    setOpen(true);
  };

  const openEdit = (s: SponsorRow) => {
    setEditing(s);
    setForm({
      logo_url: s.logo_url,
      firm_name: s.firm_name,
      owner_name: s.owner_name,
      tagline: s.tagline,
      website: s.website,
      sponsorship_type: s.sponsorship_type ?? "Event Sponsor",
      contact_number: s.contact_number ?? null,
      display_order: s.display_order,
      is_active: s.is_active,
    });
    setOpen(true);
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("sponsor-logos")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("sponsor-logos").getPublicUrl(path);
      setForm((f) => ({ ...f, logo_url: data.publicUrl }));
      toast({ title: "Logo uploaded" });
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e?.message ?? "Try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    const parsed = schema.safeParse({
      ...form,
      website: form.website ?? "",
      contact_number: form.contact_number ?? "",
    });
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message,
        variant: "destructive",
      });
      return;
    }
    const payload = parsed.data as SponsorInput;
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, patch: payload });
        toast({ title: "Sponsor updated" });
      } else {
        await create.mutateAsync(payload);
        toast({ title: "Sponsor added" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message ?? "Try again",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (s: SponsorRow) => {
    try {
      await update.mutateAsync({ id: s.id, patch: { is_active: !s.is_active } });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast({ title: "Sponsor deleted" });
      setConfirmDelete(null);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" /> Sponsors
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage homepage sponsorship cards — logo, firm name, owner, and tagline shown beside the hero section.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Sponsor
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : sponsors.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No sponsors yet. Add your first sponsor to show on the homepage.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sponsors.map((s) => (
              <li key={s.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="h-14 w-20 shrink-0 rounded-lg border border-border bg-muted/50 flex items-center justify-center overflow-hidden">
                      {s.logo_url ? (
                        <img
                          src={s.logo_url}
                          alt={s.firm_name}
                          className="max-h-12 max-w-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {s.sponsorship_type && (
                          <Badge className="text-[10px] uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">
                            {s.sponsorship_type}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          Order {s.display_order}
                        </Badge>
                        {!s.is_active && (
                          <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-foreground">{s.firm_name}</p>
                      <p className="text-sm text-primary">{s.owner_name}</p>
                      {s.tagline && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{s.tagline}</p>
                      )}
                      {s.website && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{s.website}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleActive(s)}
                      title={s.is_active ? "Hide from homepage" : "Show on homepage"}
                    >
                      {s.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(s)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmDelete(s)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="logo_url">Company Logo URL</Label>
              <Input
                id="logo_url"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              <div className="flex items-center gap-2 pt-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading…" : "Upload logo"}
                </Button>
                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt="Preview"
                    className="h-10 w-auto max-w-[120px] object-contain rounded border border-border"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firm_name">Firm Name</Label>
              <Input
                id="firm_name"
                value={form.firm_name}
                maxLength={120}
                onChange={(e) => setForm({ ...form, firm_name: e.target.value })}
                placeholder="Global Compunet"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sponsorship_type">Sponsorship Type</Label>
              <Input
                id="sponsorship_type"
                list="sponsorship-type-options"
                value={form.sponsorship_type}
                maxLength={60}
                onChange={(e) => setForm({ ...form, sponsorship_type: e.target.value })}
                placeholder="Diary Sponsor"
              />
              <datalist id="sponsorship-type-options">
                {SPONSORSHIP_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Shown as a badge on the homepage card, e.g. "Gold Sponsor".
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner_name">Owner Name</Label>
              <Input
                id="owner_name"
                value={form.owner_name}
                maxLength={120}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                placeholder="Rajesh Chauhan"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Textarea
                id="tagline"
                rows={2}
                maxLength={240}
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="Reliable IT solutions for growing businesses."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                value={form.website ?? ""}
                onChange={(e) => setForm({ ...form, website: e.target.value || null })}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_number">Contact Number (optional)</Label>
              <Input
                id="contact_number"
                type="tel"
                maxLength={20}
                value={form.contact_number ?? ""}
                onChange={(e) => setForm({ ...form, contact_number: e.target.value || null })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(e) =>
                    setForm({ ...form, display_order: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label htmlFor="is_active">Visible on homepage</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              {editing ? "Save changes" : "Add sponsor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sponsor?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{confirmDelete?.firm_name}</strong> from the homepage. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
