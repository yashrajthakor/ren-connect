-- RBN Homepage Sponsors
CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text NOT NULL,
  firm_name text NOT NULL,
  owner_name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  website text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_active_order
  ON public.sponsors(is_active, display_order ASC, created_at ASC);

GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active sponsors" ON public.sponsors;
CREATE POLICY "Public reads active sponsors" ON public.sponsors FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins read all sponsors" ON public.sponsors;
CREATE POLICY "Admins read all sponsors" ON public.sponsors FOR SELECT
TO authenticated USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins manage sponsors" ON public.sponsors;
CREATE POLICY "Admins manage sponsors" ON public.sponsors FOR ALL
TO authenticated
USING (public.is_admin_or_super())
WITH CHECK (public.is_admin_or_super());

CREATE OR REPLACE FUNCTION public.tg_sponsors_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sponsors_updated_trigger ON public.sponsors;
CREATE TRIGGER sponsors_updated_trigger
BEFORE UPDATE ON public.sponsors
FOR EACH ROW EXECUTE FUNCTION public.tg_sponsors_updated();

-- Storage bucket for sponsor logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read sponsor logos" ON storage.objects;
CREATE POLICY "Public read sponsor logos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'sponsor-logos');

DROP POLICY IF EXISTS "Admins upload sponsor logos" ON storage.objects;
CREATE POLICY "Admins upload sponsor logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sponsor-logos' AND public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins update sponsor logos" ON storage.objects;
CREATE POLICY "Admins update sponsor logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sponsor-logos' AND public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins delete sponsor logos" ON storage.objects;
CREATE POLICY "Admins delete sponsor logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sponsor-logos' AND public.is_admin_or_super());

-- Seed initial sponsors (skip if table already has rows)
INSERT INTO public.sponsors (logo_url, firm_name, owner_name, tagline, website, display_order, is_active)
SELECT * FROM (VALUES
  (
    'https://fplogoimages.withfloats.com/actual/69c8cbb00a0740db5e86f3b3.jpeg',
    'Global Compunet',
    'Rajesh Chauhan',
    'Reliable IT solutions for growing businesses.',
    'https://globalcompunet.com',
    1,
    true
  ),
  (
    'https://www.thinknlink.in/lovable-uploads/ThinkNLink%20logo%20White.png',
    'Thinknlink AI Solution',
    'Karan Singh',
    'Smart automation for the modern enterprise.',
    'https://www.thinknlink.in',
    2,
    true
  ),
  (
    'https://scontent.famd21-1.fna.fbcdn.net/v/t39.30808-6/393154366_122095830638143504_3446062251949276181_n.jpg',
    'Homeify Decor & Furnishing',
    'Vikram Sisodia',
    'Transforming spaces with premium interiors.',
    NULL,
    3,
    true
  ),
  (
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQurHrPdL-zEBwcXzkqW-v74ILR9iFDisVbIw&s',
    'Get Set Fly',
    'Aditya Rathore',
    'Your journey to success starts here.',
    NULL,
    4,
    true
  )
) AS seed(logo_url, firm_name, owner_name, tagline, website, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.sponsors LIMIT 1);
