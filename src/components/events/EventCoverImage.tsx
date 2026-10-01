import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { isGoogleDriveUrl, extractDriveFileId } from "@/lib/googleDrive";
import { useDriveImage } from "@/hooks/useDriveImage";

/** Shared empty/failed state — a plain external image URL or a Drive link that can't be embedded both land here. */
function CoverPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-royal">
      <CalendarDays className="h-10 w-10 text-card/50" />
    </div>
  );
}

function DriveCoverImage({ fileId, alt, className }: { fileId: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const { src, failed, onError } = useDriveImage(fileId, 1200);

  if (failed) return <CoverPlaceholder />;
  return (
    <>
      {!loaded && <div className="absolute inset-0 bg-muted" />}
      <img
        src={src ?? undefined}
        alt={alt}
        loading="lazy"
        className={`${className ?? ""} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={onError}
      />
    </>
  );
}

/**
 * Renders an event's cover image, whether it's a plain external image URL
 * or a Google Drive share link (pasting the raw .../view?usp=sharing link
 * directly into "Cover Image URL" is a very natural admin mistake — Drive
 * share links aren't image resources at all, so this makes that work the
 * same way the gallery already does instead of silently rendering blank).
 * Falls back to a plain gradient placeholder when there's no image, or
 * when Drive won't allow the embed.
 */
export default function EventCoverImage({
  coverImage,
  alt,
  className = "w-full h-full object-cover",
}: {
  coverImage: string | null;
  alt: string;
  className?: string;
}) {
  if (!coverImage) return <CoverPlaceholder />;

  if (isGoogleDriveUrl(coverImage)) {
    const fileId = extractDriveFileId(coverImage);
    if (!fileId) return <CoverPlaceholder />;
    return <DriveCoverImage fileId={fileId} alt={alt} className={className} />;
  }

  return <img src={coverImage} alt={alt} loading="lazy" className={className} />;
}
