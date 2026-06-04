import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  useAllNotices,
  useNoticeMutations,
  NOTICE_CATEGORY_LABEL,
  NOTICE_CATEGORY_EMOJI,
  NOTICE_PRIORITY_LABEL,
  type Notice,
  type NoticeCategory,
  type NoticePriority,
  type NoticeInput,
} from "@/hooks/useNoticeBoard";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  Eye,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(160),
  description: z.string().min(5, "Description must be at least 5 characters").max(2000),
  category: z.enum([
    "meeting",
    "event",
    "announcement",
    "reminder",
    "alert",
    "community_update",
  ]),
  priority: z.enum(["high", "medium", "normal"]),
  is_pinned: z.boolean(),
  is_active: z.boolean(),
  publish_date: z.string().min(1, "Publish date is required"),
  expiry_date: z.string().nullable(),
});

const CATEGORIES: NoticeCategory[] = [
  "meeting",
  "event",
  "announcement",
  "reminder",
  "alert",
  "community_update",
];
const PRIORITIES: NoticePriority[] = ["high", "medium", "normal"];

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  return new Date(local).toISOString();
}

const emptyForm = (): NoticeInput => ({
  title: "",
  description: "",
  category: "announcement",
  priority: "normal",
  is_pinned: false,
  is_active: true,
  publish_date: new Date().toISOString(),
  expiry_date: null,
});

export default function AdminNoticeBoardPage() {
  const { toast } = useToast();
  const { data: notices = [], isLoading } = useAllNotices(true);
  const { create, update, remove } = useNoticeMutations();

  const [editing, setEditing] = useState<Notice | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NoticeInput>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<Notice | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditing(n);
    setForm({
      title: n.title,
      description: n.description,
      category: n.category,
      priority: n.priority,
      is_pinned: n.is_pinned,
      is_active: n.is_active,
      publish_date: n.publish_date,
      expiry_date: n.expiry_date,
    });
    setOpen(true);
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message,
        variant: "destructive",
      });
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, patch: parsed.data });
        toast({ title: "Notice updated" });
      } else {
        await create.mutateAsync(parsed.data);
        toast({ title: "Notice published" });
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

  const togglePin = async (n: Notice) => {
    try {
      await update.mutateAsync({ id: n.id, patch: { is_pinned: !n.is_pinned } });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  const toggleActive = async (n: Notice) => {
    try {
      await update.mutateAsync({ id: n.id, patch: { is_active: !n.is_active } });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast({ title: "Notice deleted" });
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
            <Megaphone className="h-6 w-6 text-primary" /> Notice Board
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Publish meetings, events, and important community updates visible on the homepage and member dashboard.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Notice
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : notices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No notices yet. Create your first one.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notices.map((n) => (
              <li key={n.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary" className="capitalize">
                        <span className="mr-1">{NOTICE_CATEGORY_EMOJI[n.category]}</span>
                        {NOTICE_CATEGORY_LABEL[n.category]}
                      </Badge>
                      <Badge
                        variant={n.priority === "high" ? "default" : "outline"}
                        className="uppercase text-[10px] tracking-wider"
                      >
                        {NOTICE_PRIORITY_LABEL[n.priority]}
                      </Badge>
                      {n.is_pinned && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          <Pin className="h-3 w-3 mr-1" /> Pinned
                        </Badge>
                      )}
                      {!n.is_active && (
                        <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{n.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Publish {format(new Date(n.publish_date), "PPp")}
                      {n.expiry_date && ` · Expires ${format(new Date(n.expiry_date), "PPp")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => togglePin(n)} title={n.is_pinned ? "Unpin" : "Pin"}>
                      {n.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleActive(n)} title={n.is_active ? "Disable" : "Enable"}>
                      {n.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(n)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmDelete(n)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Notice" : "New Notice"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                maxLength={160}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Monthly Business Meeting – 15 June"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                maxLength={2000}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Full details, venue, agenda..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as NoticeCategory })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {NOTICE_CATEGORY_EMOJI[c]} {NOTICE_CATEGORY_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as NoticePriority })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {NOTICE_PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="publish_date">Publish date</Label>
                <Input
                  id="publish_date"
                  type="datetime-local"
                  value={toLocalInput(form.publish_date)}
                  onChange={(e) =>
                    setForm({ ...form, publish_date: fromLocalInput(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiry_date">Expiry date (optional)</Label>
                <Input
                  id="expiry_date"
                  type="datetime-local"
                  value={form.expiry_date ? toLocalInput(form.expiry_date) : ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expiry_date: e.target.value ? fromLocalInput(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_pinned"
                  checked={form.is_pinned}
                  onCheckedChange={(v) => setForm({ ...form, is_pinned: v })}
                />
                <Label htmlFor="is_pinned" className="cursor-pointer">Pin to top</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              {editing ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this notice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notice will be removed from the homepage and dashboard immediately.
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