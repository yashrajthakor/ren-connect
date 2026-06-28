import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Building2, Loader2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useAllSponsors, useCreateSponsor, useUpdateSponsor, useDeleteSponsor,
  type Sponsor, type SponsorInput,
} from "@/hooks/useSponsors";

const EMPTY_FORM: SponsorInput = {
  sponsor_name: "",
  firm_name: "",
  business_category: "",
  logo_url: null,
  contact_number: "",
  website: null,
  tagline: null,
  is_active: true,
  display_order: 0,
};

export default function AdminSponsors() {
  const { toast } = useToast();
  const { data: sponsors = [], isLoading } = useAllSponsors(true);
  const createSponsor = useCreateSponsor();
  const updateSponsor = useUpdateSponsor();
  const deleteSponsor = useDeleteSponsor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState<SponsorInput>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, display_order: sponsors.length });
    setDialogOpen(true);
  };

  const openEdit = (s: Sponsor) => {
    setEditing(s);
    setForm({
      sponsor_name: s.sponsor_name,
      firm_name: s.firm_name,
      business_category: s.business_category,
      logo_url: s.logo_url,
      contact_number: s.contact_number,
      website: s.website,
      tagline: s.tagline,
      is_active: s.is_active,
      display_order: s.display_order,
    });
    setDialogOpen(true);
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() || "jpg";
      // Path must start with the user's UUID to satisfy the storage RLS policy
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("company-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
      setForm((f) => ({ ...f, logo_url: data.publicUrl }));
      toast({ title: "Logo uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.sponsor_name.trim() || !form.firm_name.trim() || !form.contact_number.trim() || !form.business_category.trim()) {
      toast({ title: "Required fields missing", description: "Name, Firm, Category and Contact are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: SponsorInput = {
        ...form,
        sponsor_name: form.sponsor_name.trim(),
        firm_name: form.firm_name.trim(),
        business_category: form.business_category.trim(),
        contact_number: form.contact_number.trim(),
        website: form.website?.trim() || null,
        tagline: form.tagline?.trim() || null,
        display_order: Number(form.display_order) || 0,
      };
      if (editing) {
        await updateSponsor.mutateAsync({ id: editing.id, patch: payload });
        toast({ title: "Sponsor updated" });
      } else {
        await createSponsor.mutateAsync(payload);
        toast({ title: "Sponsor added" });
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to save", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: Sponsor) => {
    try {
      await updateSponsor.mutateAsync({ id: s.id, patch: { is_active: !s.is_active } });
      toast({ title: s.is_active ? "Sponsor hidden" : "Sponsor shown" });
    } catch (e: any) {
      toast({ title: "Failed to update", description: e?.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSponsor.mutateAsync(deleteId);
      toast({ title: "Sponsor deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" /> Sponsor Highlights
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage sponsors shown on the homepage carousel.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Sponsor
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sponsors.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No sponsors yet</p>
          <p className="text-sm text-muted-foreground/70">Add your first sponsor to display them on the homepage.</p>
          <Button onClick={openCreate} className="mt-2 gap-2">
            <Plus className="h-4 w-4" /> Add Sponsor
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sponsors.map((s) => (
            <Card key={s.id} className="p-4 flex items-center gap-4">
              {/* Logo */}
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0">
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.firm_name} className="h-full w-full object-contain p-1" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-secondary truncate">{s.sponsor_name}</span>
                  <span className="text-muted-foreground text-sm">·</span>
                  <span className="text-sm text-muted-foreground truncate">{s.firm_name}</span>
                  <Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px]">
                    {s.is_active ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                  <span>{s.business_category}</span>
                  <span>·</span>
                  <span>{s.contact_number}</span>
                  {s.website && <><span>·</span><span className="truncate">{s.website}</span></>}
                  <span>·</span>
                  <span>Order: {s.display_order}</span>
                </div>
                {s.tagline && (
                  <p className="text-xs text-muted-foreground/70 italic mt-0.5 line-clamp-1">"{s.tagline}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(s)}
                  className="gap-1 text-xs"
                  title={s.is_active ? "Hide sponsor" : "Show sponsor"}
                >
                  {s.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sponsor Name *</Label>
                <Input
                  value={form.sponsor_name}
                  onChange={(e) => setForm((f) => ({ ...f, sponsor_name: e.target.value }))}
                  placeholder="Rajesh Sharma"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Firm Name *</Label>
                <Input
                  value={form.firm_name}
                  onChange={(e) => setForm((f) => ({ ...f, firm_name: e.target.value }))}
                  placeholder="Sharma Enterprises"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Business Category *</Label>
                <Input
                  value={form.business_category}
                  onChange={(e) => setForm((f) => ({ ...f, business_category: e.target.value }))}
                  placeholder="Construction & Real Estate"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Number *</Label>
                <Input
                  value={form.contact_number}
                  onChange={(e) => setForm((f) => ({ ...f, contact_number: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Website (optional)</Label>
              <Input
                value={form.website ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value || null }))}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Short Tagline (optional)</Label>
              <Textarea
                value={form.tagline ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value || null }))}
                placeholder="Building tomorrow's infrastructure today"
                rows={2}
              />
            </div>

            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Building2 className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                    className="text-sm"
                  />
                  {form.logo_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive h-auto p-0"
                      onClick={() => setForm((f) => ({ ...f, logo_url: null }))}
                    >
                      Remove logo
                    </Button>
                  )}
                  {uploading && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  {form.is_active ? "Active (visible)" : "Hidden"}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : editing ? "Save Changes" : "Add Sponsor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sponsor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the sponsor from the homepage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
