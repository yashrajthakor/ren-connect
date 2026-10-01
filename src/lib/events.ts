import { supabase } from "@/integrations/supabase/client";

export type EventStatus = "draft" | "published";

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  event_date: string | null;
  cover_image: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventGalleryImage {
  id: string;
  event_id: string;
  drive_url: string;
  drive_file_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

export async function fetchPublishedEvents(opts: { search?: string; limit?: number } = {}) {
  let q = supabase
    .from("events" as any)
    .select("*")
    .eq("status", "published")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (opts.search && opts.search.trim()) {
    const s = opts.search.trim().replace(/[%_]/g, "");
    q = q.or(`title.ilike.%${s}%,summary.ilike.%${s}%`);
  }
  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as unknown as EventRow[];
}

export async function fetchEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from("events" as any)
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EventRow) || null;
}

export async function fetchEventGallery(eventId: string) {
  const { data, error } = await supabase
    .from("event_gallery_images" as any)
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as EventGalleryImage[];
}
