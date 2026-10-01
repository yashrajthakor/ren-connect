import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEvent } from "@/hooks/useEvents";
import { useEventGalleryImages, useEventGalleryMutations } from "@/hooks/useEventGallery";
import { parseDriveUrl, getDriveViewUrl } from "@/lib/googleDrive";
import { useDriveImage } from "@/hooks/useDriveImage";
import type { EventGalleryImage } from "@/lib/events";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ImageOff,
  ExternalLink,
  Loader2,
} from "lucide-react";

/** Shows a Drive thumbnail; falls back to an "Open Photo" link if the image never loads
 * (some Drive files can't be embedded even when shared — the URL itself is still saved). */
function PhotoThumb({ fileId }: { fileId: string }) {
  const { src, failed, onError } = useDriveImage(fileId);
  if (failed) {
    return (
      <a
        href={getDriveViewUrl(fileId)}
        target="_blank"
        rel="noreferrer"
        className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground hover:text-primary"
      >
        <ImageOff className="h-5 w-5" />
        <span className="text-[10px] font-medium">Open Photo</span>
      </a>
    );
  }
  return (
    <img
      src={src ?? undefined}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover"
      onError={onError}
    />
  );
}

export default function AdminEventGalleryPage() {
  const { eventId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: event } = useEvent(eventId);
  const { data: images = [], isLoading } = useEventGalleryImages(eventId);
  const { add, remove, swapOrder } = useEventGalleryMutations(eventId);

  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Live preview as the admin types/pastes — lets them see the extracted
  // file ID and a thumbnail before committing to "Add Photo".
  const preview = useMemo(() => (url.trim() ? parseDriveUrl(url) : null), [url]);
  const isDuplicate = !!preview && images.some((img) => img.drive_file_id === preview.fileId);

  const submitUrl = async () => {
    setUrlError(null);
    const parsed = parseDriveUrl(url);
    if (!parsed) {
      setUrlError("Enter a valid Google Drive share link (e.g. .../file/d/FILE_ID/view).");
      return;
    }
    if (images.some((img) => img.drive_file_id === parsed.fileId)) {
      setUrlError("This photo has already been added to this event.");
      return;
    }
    try {
      const nextOrder = images.length ? Math.max(...images.map((i) => i.sort_order)) + 1 : 0;
      await add.mutateAsync({ drive_url: url.trim(), drive_file_id: parsed.fileId, sort_order: nextOrder });
      setUrl("");
      toast({ title: "Photo added" });
    } catch (e: any) {
      setUrlError(e?.message ?? "Could not add this photo. Try again.");
    }
  };

  const doRemove = async (image: EventGalleryImage) => {
    try {
      await remove.mutateAsync(image.id);
      toast({ title: "Photo removed" });
    } catch (e: any) {
      toast({ title: "Remove failed", description: e?.message, variant: "destructive" });
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const other = images[index + direction];
    const current = images[index];
    if (!other) return;
    try {
      await swapOrder.mutateAsync({ a: current, b: other });
    } catch (e: any) {
      toast({ title: "Reorder failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> All events
        </Link>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">
          {event ? event.title : "Event"} — Photo Gallery
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste Google Drive photo links below. Only the link is stored — nothing is uploaded to RBN.
        </p>
      </div>

      <Card className="p-4 sm:p-5 space-y-2">
        <Label htmlFor="drive-url">Add Photo — Google Drive URL</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="drive-url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) setUrlError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && submitUrl()}
            placeholder="https://drive.google.com/file/d/xxxxx/view?usp=sharing"
          />
          <Button onClick={submitUrl} disabled={add.isPending || !url.trim()}>
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Photo
          </Button>
        </div>
        {urlError && <p className="text-xs text-destructive">{urlError}</p>}

        {url.trim() && !urlError && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            {preview ? (
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                <PhotoThumb fileId={preview.fileId} />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <ImageOff className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 text-xs">
              {preview ? (
                <>
                  <p className="text-muted-foreground">
                    File ID: <span className="font-mono text-foreground">{preview.fileId}</span>
                  </p>
                  {isDuplicate ? (
                    <p className="text-destructive mt-0.5">Already added to this event.</p>
                  ) : (
                    <p className="text-muted-foreground mt-0.5">
                      Preview unavailable here just means Drive won't embed it — it will still be saved.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Not a recognizable Google Drive link yet — keep typing or paste the full share URL.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : images.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No photos yet. Paste a Drive link above to add the first one.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {images.map((img, i) => (
              <li key={img.id} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  <PhotoThumb fileId={img.drive_file_id} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">{img.drive_url}</p>
                  <a
                    href={getDriveViewUrl(img.drive_file_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open in Drive <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={i === 0 || swapOrder.isPending}
                    onClick={() => move(i, -1)}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={i === images.length - 1 || swapOrder.isPending}
                    onClick={() => move(i, 1)}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => doRemove(img)}
                    title="Remove"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex justify-end">
        <Button variant="royal" onClick={() => navigate("/admin/events")}>
          Save Gallery
        </Button>
      </div>
    </div>
  );
}
