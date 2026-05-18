-- Newsletter / Stories / Community Updates

CREATE TABLE IF NOT EXISTS public.newsletter_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'community_news',
  cover_image text,
  author_name text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  publish_date timestamptz,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_posts_status_pubdate
  ON public.newsletter_posts (status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_posts_category
  ON public.newsletter_posts (category);
CREATE INDEX IF NOT EXISTS idx_newsletter_posts_featured
  ON public.newsletter_posts (featured) WHERE featured = true;

ALTER TABLE public.newsletter_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published posts" ON public.newsletter_posts;
CREATE POLICY "Public read published posts"
ON public.newsletter_posts FOR SELECT
TO anon, authenticated
USING (status = 'published');

DROP POLICY IF EXISTS "Admins read all posts" ON public.newsletter_posts;
CREATE POLICY "Admins read all posts"
ON public.newsletter_posts FOR SELECT
TO authenticated
USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins insert posts" ON public.newsletter_posts;
CREATE POLICY "Admins insert posts"
ON public.newsletter_posts FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins update posts" ON public.newsletter_posts;
CREATE POLICY "Admins update posts"
ON public.newsletter_posts FOR UPDATE
TO authenticated
USING (public.is_admin_or_super())
WITH CHECK (public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins delete posts" ON public.newsletter_posts;
CREATE POLICY "Admins delete posts"
ON public.newsletter_posts FOR DELETE
TO authenticated
USING (public.is_admin_or_super());

CREATE OR REPLACE FUNCTION public.touch_newsletter_posts_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_newsletter_posts_updated_at ON public.newsletter_posts;
CREATE TRIGGER trg_newsletter_posts_updated_at
BEFORE UPDATE ON public.newsletter_posts
FOR EACH ROW EXECUTE FUNCTION public.touch_newsletter_posts_updated_at();

CREATE OR REPLACE FUNCTION public.increment_newsletter_view(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.newsletter_posts
  SET views_count = views_count + 1
  WHERE slug = _slug AND status = 'published';
$$;
GRANT EXECUTE ON FUNCTION public.increment_newsletter_view(text) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('newsletter', 'newsletter', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read newsletter assets" ON storage.objects;
CREATE POLICY "Public read newsletter assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'newsletter');

DROP POLICY IF EXISTS "Admins upload newsletter assets" ON storage.objects;
CREATE POLICY "Admins upload newsletter assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'newsletter' AND public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins update newsletter assets" ON storage.objects;
CREATE POLICY "Admins update newsletter assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'newsletter' AND public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins delete newsletter assets" ON storage.objects;
CREATE POLICY "Admins delete newsletter assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'newsletter' AND public.is_admin_or_super());
