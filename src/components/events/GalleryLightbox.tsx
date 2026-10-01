import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, ExternalLink, Loader2 } from "lucide-react";
import { getDriveViewUrl, getDrivePreviewUrl } from "@/lib/googleDrive";
import type { EventGalleryImage } from "@/lib/events";

interface Props {
  images: EventGalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

export default function GalleryLightbox({ images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);

  const total = images.length;
  const current = images[index];

  const goTo = (next: number) => {
    setLoaded(false);
    setIndex(((next % total) + total) % total);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!current) return null;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-full w-screen h-screen sm:h-[90vh] sm:w-[92vw] border-none bg-black/95 p-0 shadow-none sm:rounded-xl [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{`Photo ${index + 1} of ${total}`}</DialogTitle>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
          {index + 1} / {total}
        </div>

        {total > 1 && (
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-10">
          {!loaded && <Loader2 className="absolute h-8 w-8 animate-spin text-white/60" />}
          {/* Google's own supported embed endpoint for third-party pages — unlike
              a raw <img> host, this reliably renders for any file shared
              "Anyone with the link" (see googleDrive.ts for why <img> doesn't). */}
          <iframe
            key={current.id}
            src={getDrivePreviewUrl(current.drive_file_id)}
            title={`Photo ${index + 1} of ${total}`}
            className={`h-full w-full max-w-3xl rounded-lg border-0 transition-opacity duration-200 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            allow="autoplay"
            onLoad={() => setLoaded(true)}
          />
        </div>

        {total > 1 && (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next photo"
            className="absolute right-2 sm:right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <a
          href={getDriveViewUrl(current.drive_file_id)}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
        >
          Open original in Drive <ExternalLink className="h-3 w-3" />
        </a>
      </DialogContent>
    </Dialog>
  );
}
