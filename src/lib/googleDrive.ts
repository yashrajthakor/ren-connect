/**
 * Google Drive share-link parsing for the Event Gallery feature.
 *
 * The admin pastes whatever URL Drive's own "Share" dialog produces
 * (typically `.../file/d/FILE_ID/view?usp=sharing`); we only ever need the
 * FILE_ID out of it; we never call the Drive API and never need credentials.
 * The `/view` URL itself cannot be used as an <img src> — Drive redirects it
 * to an HTML viewer page — so callers must build a thumbnail/content URL
 * from the extracted file ID instead (see getDriveThumbnailUrl).
 */

const DRIVE_HOSTS = ["drive.google.com", "docs.google.com"];

export function isGoogleDriveUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return DRIVE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Extract the file ID from common Drive share URL shapes:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/file/d/FILE_ID/edit
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&export=download
 *   https://docs.google.com/.../d/FILE_ID/...
 * Returns null if no ID-shaped segment can be found.
 */
export function extractDriveFileId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const pathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (pathMatch) return pathMatch[1];

  try {
    const idParam = new URL(trimmed).searchParams.get("id");
    if (idParam && idParam.length >= 10) return idParam;
  } catch {
    // Not a parseable absolute URL — nothing left to try.
  }

  return null;
}

/**
 * A directly-embeddable image URL for a Drive file (works for files shared
 * "Anyone with the link"). Served from lh3.googleusercontent.com — the same
 * host drive.google.com/thumbnail itself redirects to.
 *
 * Confirmed by direct testing: Google blocks this (and every other Drive
 * image URL shape we tried) when loaded as an <img> from a third-party page
 * — same file ID, works fine on direct navigation, fails as a subresource
 * embed, regardless of referrer policy. So this is attempted opportunistically
 * (occasionally still works) but callers must not depend on it — see
 * getDrivePreviewUrl for the reliable path (an iframe, which Google does
 * support for third-party embedding).
 */
export function getDriveThumbnailUrl(fileId: string, size = 1000): string {
  return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w${size}`;
}

/** The undocumented drive.google.com endpoint — kept only as a fallback if getDriveThumbnailUrl's host ever fails for a given file. */
export function getDriveThumbnailFallbackUrl(fileId: string, size = 1000): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${size}`;
}

/** The canonical "view in Drive" URL for a file ID — used for "Open Photo" fallback links. */
export function getDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}

/**
 * Google's own supported third-party embed endpoint — an iframe (not an
 * <img>) pointed here renders the file in Drive's viewer. Unlike the raw
 * image hosts above, this one is meant to be embedded cross-origin and
 * reliably works for any file shared "Anyone with the link". Used for the
 * lightbox's full view.
 */
export function getDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}

export interface ParsedDriveUrl {
  fileId: string;
}

/** Validate + parse a pasted Drive URL in one step, for the admin "Add Photo" form. */
export function parseDriveUrl(url: string): ParsedDriveUrl | null {
  if (!isGoogleDriveUrl(url)) return null;
  const fileId = extractDriveFileId(url);
  if (!fileId) return null;
  return { fileId };
}
