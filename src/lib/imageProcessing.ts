/**
 * Client-side image pipeline for photo uploads:
 * decode → (optional crop) → downscale → re-encode as JPEG.
 *
 * Re-encoding via canvas guarantees a web-friendly format (fixes previews
 * for exotic camera formats), strips EXIF weight, and compresses large
 * camera photos before upload.
 */

export type CropAreaPixels = { x: number; y: number; width: number; height: number };

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/** Read a picked file into a data URL (more reliable than object URLs in webviews). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

/** Decode an image source; rejects for formats the browser can't display (e.g. HEIC on Android). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error("This image format isn't supported on this device. Please choose a JPG or PNG photo.")
      );
    img.src = src;
  });
}

/**
 * Crop (optional) + downscale + re-encode to JPEG.
 * Pass `crop: null` to keep the full image.
 */
export async function cropAndCompressImage(
  src: string,
  crop: CropAreaPixels | null,
  maxDimension: number = MAX_DIMENSION,
  quality: number = JPEG_QUALITY
): Promise<Blob> {
  const img = await loadImage(src);

  const sx = crop ? crop.x : 0;
  const sy = crop ? crop.y : 0;
  const sw = crop ? crop.width : img.naturalWidth;
  const sh = crop ? crop.height : img.naturalHeight;

  const scale = Math.min(1, maxDimension / Math.max(sw, sh));
  const outW = Math.max(1, Math.round(sw * scale));
  const outH = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image on this device.");
  // White backdrop so transparent PNGs don't turn black when re-encoded as JPEG.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Could not process the image on this device.");
  return blob;
}
