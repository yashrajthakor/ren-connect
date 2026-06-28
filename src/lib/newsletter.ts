import { supabase } from "@/integrations/supabase/client";

export type NewsletterStatus = "draft" | "published";

export interface NewsletterPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  category: string;
  cover_image: string | null;
  author_name: string | null;
  author_id?: string | null;
  status: NewsletterStatus;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  publish_date: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export const NEWSLETTER_CATEGORIES: { value: string; label: string }[] = [
  { value: "success_stories", label: "Success Stories" },
  { value: "member_spotlight", label: "Member Spotlight" },
  { value: "business_tips", label: "Business Tips" },
  { value: "events", label: "Events" },
  { value: "jobs", label: "Jobs" },
  { value: "community_news", label: "Community News" },
  { value: "government_schemes", label: "Government Schemes" },
  { value: "announcements", label: "Announcements" },
];

export const categoryLabel = (v: string) =>
  NEWSLETTER_CATEGORIES.find((c) => c.value === v)?.label || v;

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

export async function fetchPublishedPosts(opts: {
  search?: string;
  category?: string;
  limit?: number;
} = {}) {
  let q = supabase
    .from("newsletter_posts" as any)
    .select("*")
    .eq("status", "published")
    .order("publish_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (opts.category && opts.category !== "all") q = q.eq("category", opts.category);
  if (opts.search && opts.search.trim()) {
    const s = opts.search.trim().replace(/[%_]/g, "");
    q = q.or(`title.ilike.%${s}%,summary.ilike.%${s}%,content.ilike.%${s}%`);
  }
  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as unknown as NewsletterPost[];
}

export async function fetchPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from("newsletter_posts" as any)
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as NewsletterPost) || null;
}