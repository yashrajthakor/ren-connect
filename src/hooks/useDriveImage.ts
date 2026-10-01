import { useEffect, useState } from "react";
import { getDriveThumbnailUrl, getDriveThumbnailFallbackUrl } from "@/lib/googleDrive";

/**
 * Resolves a Drive file ID to a loadable image src, retrying with the
 * undocumented drive.google.com/thumbnail endpoint if the primary
 * lh3.googleusercontent.com host fails for that file (or is rate-limited),
 * before finally giving up so the caller can show an "Open Photo" fallback.
 */
export function useDriveImage(fileId: string, size = 1000) {
  const [stage, setStage] = useState<"primary" | "fallback" | "failed">("primary");

  useEffect(() => {
    setStage("primary");
  }, [fileId]);

  const src =
    stage === "primary"
      ? getDriveThumbnailUrl(fileId, size)
      : stage === "fallback"
      ? getDriveThumbnailFallbackUrl(fileId, size)
      : null;

  const onError = () => setStage((s) => (s === "primary" ? "fallback" : "failed"));

  return { src, failed: stage === "failed", onError };
}
