/**
 * Turn an unknown thrown value (Supabase/Postgres/fetch errors) into a
 * message safe to show users, with friendly text for common failure modes.
 */
export function friendlyError(e: unknown, fallback: string): string {
  const msg =
    e instanceof Error
      ? e.message
      : typeof e === "string"
      ? e
      : (e as { message?: string })?.message || "";

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You appear to be offline. Check your internet connection and try again — your details are kept.";
  }
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) {
    return "Network error — please check your connection and try again. Your details are kept.";
  }
  if (/jwt|token|not authenticated|401|session/i.test(msg)) {
    return "Your session has expired. Please sign in again, then retry.";
  }
  if (/row-level security|permission denied|403/i.test(msg)) {
    return "You don't have permission to do this. If that seems wrong, contact an admin.";
  }
  return msg || fallback;
}
