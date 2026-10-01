import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAllEvents, useEventMutations, type EventInput } from "@/hooks/useEvents";
import EventCoverImage from "@/components/events/EventCoverImage";
import { slugify, type EventRow } from "@/lib/events";
import { CalendarDays, Plus, Pencil, Trash2, Images } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(2, "Title is required").max(150),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens only"),
  summary: z.string().trim().max(300),
  description: z.string().trim().max(5000),
  event_date: z.string().trim(),
  cover_image: z.string().trim(),
  status: z.enum(["draft", "published"]),
});

const emptyForm = (): EventInput => ({
  title: "",
  slug: "",
  summary: "",
  description: "",
  event_date: null,
  cover_image: null,
  status: "draft",
});

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: events = [], isLoading } = useAllEvents(true);
  const { create, update, remove } = useEventMutations();

  const [editing, setEditing] = useState<EventRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EventInput>(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EventRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (e: EventRow) => {
    setEditing(e);
    setForm({
      title: e.title,
      slug: e.slug,
      summary: e.summary ?? "",
      description: e.description ?? "",
      event_date: e.event_date,
      cover_image: e.cover_image,
      status: e.status,
    });
    setSlugTouched(true);
    setOpen(true);
  };

  const onTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  };

  const submit = async () => {
    const parsed = schema.safeParse({
      ...form,
      summary: form.summary ?? "",
      description: form.description ?? "",
      event_date: form.event_date ?? "",
      cover_image: form.cover_image ?? "",
    });
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message,
        variant: "destructive",
      });
      return;
    }
    const payload: EventInput = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary || null,
      description: parsed.data.description || null,
      event_date: parsed.data.event_date || null,
      cover_image: parsed.data.cover_image || null,
      status: parsed.data.status,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, patch: payload });
        toast({ title: "Event updated" });
      } else {
        await create.mutateAsync(payload);
        toast({ title: "Event created" });
      }
      setOpen(false);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message?.includes("duplicate") ? "That slug is already in use." : e?.message ?? "Try again",
        variant: "destructive",
      });
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast({ title: "Event deleted" });
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
            <CalendarDays className="h-6 w-6 text-primary" /> Gallary
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage events and their photo galleries shown on the public site.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Collection
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No events yet. Add your first event to start building its photo gallery.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((e) => (
              <li key={e.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="relative h-14 w-20 shrink-0 rounded-lg border border-border bg-muted/50 overflow-hidden">
                      <EventCoverImage coverImage={e.cover_image} alt={e.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant={e.status === "published" ? "default" : "outline"}
                          className="text-[10px] uppercase tracking-wider"
                        >
                          {e.status}
                        </Badge>
                        {e.event_date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(e.event_date + "T00:00:00").toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">/events/{e.slug}</p>
                      {e.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{e.summary}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/events/${e.id}/gallery`)}
                      title="Manage photo gallery"
                    >
                      <Images className="h-4 w-4 mr-1.5" /> Gallery
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(e)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmDelete(e)}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Event" : "Add Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                maxLength={150}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="RBN Cricket Tournament 2026"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                value={form.slug}
                maxLength={80}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: e.target.value });
                }}
                placeholder="rbn-cricket-tournament-2026"
              />
              <p className="text-xs text-muted-foreground">Shown at /events/{form.slug || "…"}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event_date">Event date (optional)</Label>
              <Input
                id="event_date"
                type="date"
                value={form.event_date ?? ""}
                onChange={(e) => setForm({ ...form, event_date: e.target.value || null })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">Summary (optional)</Label>
              <Textarea
                id="summary"
                rows={2}
                maxLength={300}
                value={form.summary ?? ""}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="A short one-line description shown on the events list."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                rows={4}
                maxLength={5000}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Full event details shown on the event page."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cover_image">Cover image URL (optional)</Label>
              <Input
                id="cover_image"
                value={form.cover_image ?? ""}
                onChange={(e) => setForm({ ...form, cover_image: e.target.value || null })}
                placeholder="https://example.com/cover.jpg — a Google Drive share link works too"
              />
              {form.cover_image && (
                <div className="relative h-20 w-32 overflow-hidden rounded-md border border-border bg-muted">
                  <EventCoverImage coverImage={form.cover_image} alt="Cover preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as EventInput["status"] })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (hidden from public)</SelectItem>
                  <SelectItem value="published">Published (visible on /events)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              {editing ? "Save changes" : "Add event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{confirmDelete?.title}</strong> and its entire photo gallery. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
