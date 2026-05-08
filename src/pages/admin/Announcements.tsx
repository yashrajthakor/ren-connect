import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAnnouncements, useBroadcastAnnouncement } from "@/hooks/useNotifications";
import { Megaphone, Send } from "lucide-react";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  body: z.string().min(5, "Message must be at least 5 characters").max(1000),
  target_role: z.enum(["all", "member", "admin", "super_admin"]),
  link: z.string().max(300).optional().or(z.literal("")),
});

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const broadcast = useBroadcastAnnouncement();
  const { data: announcements = [], isLoading } = useAnnouncements(true);
  const [form, setForm] = useState({ title: "", body: "", target_role: "all", link: "" });

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
      await broadcast.mutateAsync({
        title: parsed.data.title.trim(),
        body: parsed.data.body.trim(),
        target_role: parsed.data.target_role,
        link: parsed.data.link?.trim() || null,
      });
      toast({ title: "Notification sent", description: "Members will see it instantly." });
      setForm({ title: "", body: "", target_role: "all", link: "" });
    } catch (e: any) {
      toast({ title: "Failed to send", description: e?.message ?? "Try again", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" /> Broadcast Announcements
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Send instant notifications to members. Targets specific roles or everyone.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} maxLength={120}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Important update from REN" />
          </div>
          <div className="space-y-1.5">
            <Label>Target audience</Label>
            <Select value={form.target_role} onValueChange={(v) => setForm({ ...form, target_role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="member">Members only</SelectItem>
                <SelectItem value="admin">Admins only</SelectItem>
                <SelectItem value="super_admin">Super admins only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">Message</Label>
          <Textarea id="body" rows={4} value={form.body} maxLength={1000}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Type your announcement..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="link">Optional link</Label>
          <Input id="link" value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="/dashboard/leads" />
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={broadcast.isPending}>
            <Send className="h-4 w-4 mr-2" />
            {broadcast.isPending ? "Sending..." : "Send notification"}
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Delivery log</h2>
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No announcements yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {announcements.map((a) => (
                <li key={a.id} className="p-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{a.title}</p>
                        <Badge variant="secondary" className="text-[10px] uppercase">{a.target_role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Delivered to {a.recipients_count} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
