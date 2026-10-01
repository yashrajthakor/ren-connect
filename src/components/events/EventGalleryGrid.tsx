import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { useDriveImage } from "@/hooks/useDriveImage";
import type { EventGalleryImage } from "@/lib/events";
import GalleryLightbox from "./GalleryLightbox";

/**
 * Google blocks <img> embedding of Drive photos from third-party pages more
 * often than not (confirmed by direct testing — see googleDrive.ts), so a
 * grid tile that fails to load a real thumbnail still needs to be clickable
 * and open the lightbox, which uses Drive's own iframe-embeddable viewer
 * instead. This is a static placeholder, not a link — the parent <button>
 * owns the click.
 */
function GridThumb({ image }: { image: EventGalleryImage }) {
  const [loaded, setLoaded] = useState(false);
  const { src, failed, onError } = useDriveImage(image.drive_file_id, 600);

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground">
        <ImageIcon className="h-6 w-6" />
        <span className="text-xs font-medium">View photo</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img
        src={src ?? undefined}
        alt=""
        loading="lazy"
        className={`h-full w-full object-cover transition-opacity duration-300 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={onError}
      />
    </>
  );
}

export default function EventGalleryGrid({ images }: { images: EventGalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted transition-shadow hover:shadow-md"
          >
            <GridThumb image={img} />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <GalleryLightbox
          images={images}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  );
}
