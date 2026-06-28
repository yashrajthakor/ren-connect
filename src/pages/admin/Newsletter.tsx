import { useEffect, useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/context/AuthContext";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { htmlToPlainText } from "@/lib/sanitizeHtml";
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  Star,
  Upload,
  ExternalLink,
} from "lucide-react";
import {
  NEWSLETTER_CATEGORIES,
  categoryLabel,
  slugify,
  type NewsletterPost,
} from "@/lib/newsletter";
import { format } from "date-fns";
import { Link } from "react-router-dom";

type FormState = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  cover_image: string;
  author_name: string;
  status: "draft" | "published";
  featured: boolean;
  seo_title: string;
  seo_description: string;
  send_notification: boolean;
};

const empty = (authorName = ""): FormState => ({
  title: "",
  slug: "",
  summary: "",
  content: "",
  category: "community_news",
  cover_image: "",
  author_name: authorName,
  status: "draft",
  featured: false,
  seo_title: "",
  seo_description: "",
  send_notification: false,
});

const AdminNewsletter = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [posts, setPosts] = useState<NewsletterPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_posts" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setPosts((data || []) as unknown as NewsletterPost[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(empty(user?.user_metadata?.full_name || ""));
    setDialogOpen(true);
  };

  const openEdit = (p: NewsletterPost) => {
    setForm({
      id: p.id,
      title: p.title,
      slug: p.slug,
      summary: p.summary || "",
      content: p.content || "",
      category: p.category,
      cover_image: p.cover_image || "",
      author_name: p.author_name || "",
      status: p.status,
      featured: p.featured,
      seo_title: p.seo_title || "",
      seo_description: p.seo_description || "",
      send_notification: false,
    });
    setDialogOpen(true);
  };

  const onCoverUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("newsletter")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("newsletter").getPublicUrl(path);
      setForm((f) => ({ ...f, cover_image: data.publicUrl }));
      toast({ title: "Cover uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async (publish: boolean) => {
    if (!form.title.trim() || !htmlToPlainText(form.content)) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }
    const slug = (form.slug.trim() || slugify(form.title)) + (form.id ? "" : "");
    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        slug,
        summary: form.summary.trim() || null,
        content: form.content,
        category: form.category,
        cover_image: form.cover_image || null,
        author_name: form.author_name.trim() || null,
        status: publish ? "published" : form.status,
        featured: form.featured,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
      };
      const wasPublished =
        form.id && posts.find((p) => p.id === form.id)?.status === "published";
      if (publish && !wasPublished) payload.publish_date = new Date().toISOString();

      let saved: NewsletterPost | null = null;
      if (form.id) {
        const { data, error } = await supabase
          .from("newsletter_posts" as any)
          .update(payload)
          .eq("id", form.id)
          .select("*")
          .single();
        if (error) throw error;
        saved = data as unknown as NewsletterPost;
      } else {
        payload.author_id = user?.id || null;
        const { data, error } = await supabase
          .from("newsletter_posts" as any)
          .insert(payload)
          .select("*")
          .single();
        if (error) throw error;
        saved = data as unknown as NewsletterPost;
      }

      if (publish && form.send_notification && saved) {
        try {
          await supabase.rpc("broadcast_announcement" as any, {
            _title: saved.title,
            _body: saved.summary || "New story published on RBN",
            _target_role: "all",
            _link: `/news/${saved.slug}`,
          });
        } catch (e) {
          console.warn("Notification dispatch skipped", e);
        }
      }

      toast({ title: publish ? "Published" : "Saved" });
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("newsletter_posts" as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      load();
    }
    setDeleteId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" /> News & Stories
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Publish updates, member stories and community news.
          </p>
        </div>
        <Button onClick={openNew} variant="royal">
          <Plus className="h-4 w-4" /> New post
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading…</div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No posts yet. Create your first story.
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id} className="p-4 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-32 h-20 sm:h-20 bg-muted rounded-md overflow-hidden shrink-0">
                {p.cover_image ? (
                  <img src={p.cover_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-royal" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>
                    {p.status}
                  </Badge>
                  <Badge variant="outline">{categoryLabel(p.category)}</Badge>
                  {p.featured && (
                    <Badge className="gap-1">
                      <Star className="h-3 w-3" /> Featured
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-secondary truncate">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.publish_date
                    ? `Published ${format(new Date(p.publish_date), "MMM d, yyyy")}`
                    : `Created ${format(new Date(p.created_at), "MMM d, yyyy")}`}{" "}
                  • {p.views_count} views
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {p.status === "published" && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/news/${p.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setDeleteId(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit post" : "New post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    slug: f.id ? f.slug : slugify(e.target.value),
                  }))
                }
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="auto-generated"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWSLETTER_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Summary</Label>
              <Textarea
                rows={2}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="Short teaser shown in listings"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content *</Label>
              <RichTextEditor
                key={form.id ?? "new-post"}
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                placeholder="Write the article with headings, bold, lists, and links…"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cover image</Label>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                {form.cover_image && (
                  <img
                    src={form.cover_image}
                    alt=""
                    className="h-24 w-40 object-cover rounded-md border border-border"
                  />
                )}
                <div className="flex flex-col gap-2 flex-1">
                  <Input
                    value={form.cover_image}
                    onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
                    placeholder="Image URL or upload below"
                  />
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onCoverUpload(f);
                      }}
                    />
                    <Button asChild variant="outline" size="sm" disabled={uploading}>
                      <span>
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploading…" : "Upload image"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Author name</Label>
                <Input
                  value={form.author_name}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <Label className="font-medium">Featured</Label>
                  <p className="text-xs text-muted-foreground">
                    Highlight on news listing & homepage.
                  </p>
                </div>
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>SEO title</Label>
                <Input
                  value={form.seo_title}
                  onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                  placeholder="Defaults to title"
                />
              </div>
              <div className="space-y-1.5">
                <Label>SEO description</Label>
                <Input
                  value={form.seo_description}
                  onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                  placeholder="Defaults to summary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <Label className="font-medium">Send push notification on publish</Label>
                <p className="text-xs text-muted-foreground">
                  Notify all members when this story goes live.
                </p>
              </div>
              <Switch
                checked={form.send_notification}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, send_notification: v }))
                }
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => save(false)}
              disabled={saving}
            >
              Save as draft
            </Button>
            <Button variant="royal" onClick={() => save(true)} disabled={saving}>
              {saving ? "Saving…" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The article will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && remove(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNewsletter;