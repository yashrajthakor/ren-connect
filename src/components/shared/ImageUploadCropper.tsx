import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Loader2, ImagePlus, X, Camera, Image as ImageIcon, AlertCircle, RefreshCw, Check, Pencil } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { fileToDataUrl, loadImage, cropAndCompressImage, type CropAreaPixels } from "@/lib/imageProcessing";
import { friendlyError } from "@/lib/errors";
import { cn } from "@/lib/utils";

type Status = "idle" | "cropping" | "processing" | "uploading" | "error";

interface Props {
  label: string;
  /** Fixed crop aspect ratio (width / height) — the cropper does not allow free-form cropping. */
  aspect: number;
  /** "circle" for avatar-style pictures, "rect" or "square" for standard photo crops. */
  shape?: "circle" | "rect" | "square";
  /** Existing image URL, if any (e.g. the member's current profile picture). */
  value?: string | null;
  /**
   * Upload-immediately mode: called with the cropped+compressed File once the
   * admin confirms the crop; must resolve to the file's public URL. Use this
   * when a userId/session already exists (e.g. My Profile).
   */
  upload?: (file: File) => Promise<string>;
  onUploaded?: (url: string) => void;
  /**
   * Stage-only mode (no `upload` prop): called with the cropped+compressed
   * File as soon as cropping finishes, without uploading it anywhere yet.
   * Use this when no session exists yet (e.g. Signup, where the actual
   * upload happens after auth.signUp() succeeds).
   */
  onFileReady?: (file: File, previewUrl: string) => void;
  onRemoved?: () => void;
  disabled?: boolean;
}

/**
 * Reusable tap-to-upload → crop → compress → upload flow. Currently used by
 * Profile Picture (My Profile, Signup). Meeting Photo keeps its own inline
 * implementation for now and will migrate to this component later.
 */
export default function ImageUploadCropper({
  label,
  aspect,
  shape = "rect",
  value = null,
  upload,
  onUploaded,
  onFileReady,
  onRemoved,
  disabled,
}: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(value);
  const [error, setError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropAreaPixels | null>(null);
  const pendingUploadRef = useRef<File | null>(null);

  // Adopt an existing image once it loads in asynchronously (e.g. the
  // member's current picture arriving after the page mounts), but never
  // clobber a picture the admin is actively picking/cropping/replacing.
  useEffect(() => {
    if (value && !preview && status === "idle") setPreview(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const reset = (previewSeed: string | null) => {
    setStatus("idle");
    setPreview(previewSeed);
    setError(null);
    setCropSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    pendingUploadRef.current = null;
  };

  const onPick = async (f: File | null) => {
    if (!f) return;
    try {
      setError(null);
      setStatus("processing");
      const dataUrl = await fileToDataUrl(f);
      await loadImage(dataUrl);
      setCropSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setStatus("cropping");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this image.");
      setStatus("error");
    }
  };

  const uploadProcessed = async (file: File, previewUrl: string) => {
    if (!upload) return;
    setStatus("uploading");
    try {
      const url = await upload(file);
      setPreview(previewUrl);
      setCropSrc(null);
      pendingUploadRef.current = null;
      setStatus("idle");
      onUploaded?.(url);
    } catch (e) {
      pendingUploadRef.current = file;
      setError(friendlyError(e, "Upload failed. Please try again."));
      setStatus("error");
    }
  };

  const confirmCrop = async () => {
    if (!cropSrc) return;
    try {
      setStatus("processing");
      const blob = await cropAndCompressImage(cropSrc, croppedAreaPixels);
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(blob);
      if (upload) {
        await uploadProcessed(file, previewUrl);
      } else {
        onFileReady?.(file, previewUrl);
        setPreview(previewUrl);
        setCropSrc(null);
        setStatus("idle");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process this image.");
      setStatus("error");
    }
  };

  const retry = () => {
    setError(null);
    if (pendingUploadRef.current) {
      const f = pendingUploadRef.current;
      uploadProcessed(f, URL.createObjectURL(f));
    } else if (cropSrc) {
      setStatus("cropping");
    } else {
      reset(value ?? null);
    }
  };

  const removeImage = () => {
    reset(null);
    onRemoved?.();
  };

  const openPicker = (which: "camera" | "gallery") => {
    setTimeout(() => (which === "camera" ? cameraRef.current : galleryRef.current)?.click(), 0);
  };

  const busy = status !== "idle";
  const isCircle = shape === "circle";

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {status === "cropping" && cropSrc ? (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-black">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={isCircle ? "rect" : "rect"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            />
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(v) => setZoom(v[0])} className="flex-1" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => reset(value ?? null)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={confirmCrop}>
              <Check className="h-4 w-4 mr-1" /> Use Photo
            </Button>
          </div>
        </div>
      ) : status === "processing" || status === "uploading" ? (
        <div
          className={cn(
            "flex items-center justify-center gap-3 border border-dashed",
            isCircle ? "h-28 w-28 rounded-full" : "rounded-lg p-6"
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          {!isCircle && (
            <span className="text-sm text-muted-foreground">
              {status === "processing" ? "Processing image…" : "Uploading image…"}
            </span>
          )}
        </div>
      ) : status === "error" ? (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error || "Something went wrong with the photo."}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              <RefreshCw className="h-4 w-4 mr-1" /> Retry
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => reset(value ?? null)}>
              Remove photo
            </Button>
          </div>
        </div>
      ) : preview ? (
        isCircle ? (
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-full overflow-hidden border bg-muted shrink-0">
              <img src={preview} alt={label} className="h-full w-full object-cover" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Replace ${label}`}
                  disabled={disabled}
                  className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm hover:bg-accent"
                >
                  <ImagePlus className="h-4 w-4" />
                  Change picture
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem className="py-2.5" onSelect={() => openPicker("camera")}>
                  <Camera className="h-4 w-4 mr-2 text-primary" /> Take Photo
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2.5" onSelect={() => openPicker("gallery")}>
                  <ImageIcon className="h-4 w-4 mr-2 text-primary" /> Choose from Gallery
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border">
            <img src={preview} alt={label} className="w-full max-h-64 object-cover" />
            <button
              type="button"
              aria-label={`Remove ${label}`}
              disabled={disabled}
              onClick={removeImage}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 border grid place-items-center hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      ) : (
        <DropdownMenu>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-full border-2 border-dashed border-border bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
              <ImagePlus className="h-6 w-6" />
            </div>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm hover:bg-accent"
              >
                <ImagePlus className="h-4 w-4" />
                Change picture
              </button>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem className="py-2.5" onSelect={() => openPicker("camera")}>
              <Camera className="h-4 w-4 mr-2 text-primary" /> Take Photo
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5" onSelect={() => openPicker("gallery")}>
              <ImageIcon className="h-4 w-4 mr-2 text-primary" /> Choose from Gallery
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {busy && isCircle && (
        <p className="text-xs text-muted-foreground">
          {status === "processing" ? "Processing image…" : status === "uploading" ? "Uploading image…" : ""}
        </p>
      )}
    </div>
  );
}
