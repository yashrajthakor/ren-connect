import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Loader2, ImagePlus, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useActiveMembers } from "@/hooks/useLeads";
import {
  useCreateMeeting, useUpdateMeeting, uploadMeetingPhoto, type Meeting,
} from "@/hooks/useMeetings";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUserId: string;
  existing?: Meeting | null;
}

function initials(name: string) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function CreateMeetingDialog({ open, onOpenChange, currentUserId, existing }: Props) {
  const { data: members = [], isLoading: membersLoading } = useActiveMembers();
  const createMut = useCreateMeeting();
  const updateMut = useUpdateMeeting();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [receiverId, setReceiverId] = useState<string>("");
  const [summary, setSummary] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setReceiverId(existing?.meeting_with_user_id ?? "");
      setSummary(existing?.discussion_summary ?? "");
      setPhotoPreview(existing?.meeting_photo_url ?? null);
      setPhotoFile(null);
      setSearch("");
    }
  }, [open, existing]);

  const selected = members.find((m) => m.user_id === receiverId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members.slice(0, 30);
    return members
      .filter((m) =>
        m.name?.toLowerCase().includes(q) ||
        m.business?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [members, search]);

  const onPickPhoto = (f: File | null) => {
    setPhotoFile(f);
    if (f) setPhotoPreview(URL.createObjectURL(f));
    else setPhotoPreview(existing?.meeting_photo_url ?? null);
  };

  const handleSubmit = async () => {
    if (!receiverId) { toast({ title: "Select a member", variant: "destructive" }); return; }
    if (!summary.trim()) { toast({ title: "Add a discussion summary", variant: "destructive" }); return; }

    try {
      let photoUrl: string | null = existing?.meeting_photo_url ?? null;
      if (photoFile) {
        setUploading(true);
        photoUrl = await uploadMeetingPhoto(currentUserId, photoFile);
      }

      const withMember = members.find((m) => m.user_id === receiverId) as any;
      const withCats: string[] =
        withMember?.categories ?? (withMember?.category ? [withMember.category] : []);

      if (existing) {
        await updateMut.mutateAsync({
          id: existing.id,
          patch: {
            meeting_with_user_id: receiverId,
            meeting_with_categories: withCats,
            discussion_summary: summary.trim(),
            meeting_photo_url: photoUrl,
          },
        });
        toast({ title: "Meeting updated" });
      } else {
        // Snapshot my own categories
        const { data: mine } = await (supabase as any).rpc("get_members_by_user_ids", {
          _user_ids: [currentUserId],
        });
        const myself = (mine || [])[0];
        const byCats = myself?.categories ?? (myself?.category ? [myself.category] : []);

        await createMut.mutateAsync({
          meeting_by_user_id: currentUserId,
          meeting_by_categories: byCats,
          meeting_with_user_id: receiverId,
          meeting_with_categories: withCats,
          meeting_photo_url: photoUrl,
          discussion_summary: summary.trim(),
        });
        toast({ title: "Meeting saved" });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Could not save meeting", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const submitting = uploading || createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit meeting" : "Log a 1-to-1 meeting"}</DialogTitle>
          <DialogDescription>
            Record your networking meeting with a fellow RBN member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Meeting with</Label>
            {selected ? (
              <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selected.avatar_url ?? undefined} />
                    <AvatarFallback>{initials(selected.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selected.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selected.business} {selected.city ? `· ${selected.city}` : ""}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setReceiverId("")}>
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
                        onClick={() => setReceiverId(m.user_id)}
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
          </div>

          <div className="space-y-2">
            <Label>Meeting photo</Label>
            {photoPreview ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={photoPreview} alt="Meeting" className="w-full max-h-64 object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 border grid place-items-center hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tap to upload a meeting photo</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label>Discussion summary</Label>
            <Textarea
              placeholder="Discussed referral opportunities, business collaboration, and future networking plans."
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{summary.length}/1000</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {existing ? "Update meeting" : "Save meeting"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}