-- Member self-service profile management + public directory access

-- ============================================================
-- MEMBERS: allow user to read & update their own row
-- ============================================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own row" ON public.members;
CREATE POLICY "Members can read own row"
ON public.members FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can update own row" ON public.members;
CREATE POLICY "Members can update own row"
ON public.members FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Public directory: anyone (anon + authenticated) can read ACTIVE members
DROP POLICY IF EXISTS "Public can read active members" ON public.members;
CREATE POLICY "Public can read active members"
ON public.members FOR SELECT TO anon, authenticated
USING (status = 'active');

-- ============================================================
-- BUSINESS_PROFILES
-- ============================================================
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read own business profile" ON public.business_profiles;
CREATE POLICY "Owner can read own business profile"
ON public.business_profiles FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.id = business_profiles.member_id AND m.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Owner can update own business profile" ON public.business_profiles;
CREATE POLICY "Owner can update own business profile"
ON public.business_profiles FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.id = business_profiles.member_id AND m.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.members m WHERE m.id = business_profiles.member_id AND m.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Owner can insert own business profile" ON public.business_profiles;
CREATE POLICY "Owner can insert own business profile"
ON public.business_profiles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.members m WHERE m.id = business_profiles.member_id AND m.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Public can read active business profiles" ON public.business_profiles;
CREATE POLICY "Public can read active business profiles"
ON public.business_profiles FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.id = business_profiles.member_id AND m.status = 'active')
);

-- ============================================================
-- Lookup tables
-- ============================================================
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view business categories" ON public.business_categories;
CREATE POLICY "Anyone can view business categories"
ON public.business_categories FOR SELECT TO anon, authenticated USING (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='chapters') THEN
    EXECUTE 'ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view chapters" ON public.chapters';
    EXECUTE 'CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT TO anon, authenticated USING (true)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cities') THEN
    EXECUTE 'ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view cities" ON public.cities';
    EXECUTE 'CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END$$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-pictures', 'profile-pictures', true),
  ('company-logos', 'company-logos', true),
  ('visiting-cards', 'visiting-cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read profile assets" ON storage.objects;
CREATE POLICY "Public read profile assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id IN ('profile-pictures','company-logos','visiting-cards'));

DROP POLICY IF EXISTS "Users upload own profile assets" ON storage.objects;
CREATE POLICY "Users upload own profile assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('profile-pictures','company-logos','visiting-cards')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update own profile assets" ON storage.objects;
CREATE POLICY "Users update own profile assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('profile-pictures','company-logos','visiting-cards')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users delete own profile assets" ON storage.objects;
CREATE POLICY "Users delete own profile assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('profile-pictures','company-logos','visiting-cards')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- RPC: fetch the current user's full profile
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_jsonb(row) FROM (
    SELECT
      m.id              AS member_id,
      m.user_id,
      m.full_name,
      m.email,
      m.phone,
      m.profile_picture,
      m.profile_image,
      m.status,
      m.chapter_id,
      m.city_id,
      c.name            AS chapter_name,
      ci.name           AS city_name,
      bp.id             AS business_profile_id,
      bp.business_name,
      bp.category_id,
      bp.city           AS business_city,
      bp.state          AS business_state,
      bp.pincode,
      bp.address        AS business_address,
      bp.website,
      bp.services,
      bp.gst_number,
      bp.logo,
      bp.visiting_card,
      bp.linkedin_url,
      bp.instagram_url,
      bp.facebook_url,
      bcat.name         AS category_name
    FROM public.members m
    LEFT JOIN public.business_profiles bp ON bp.member_id = m.id
    LEFT JOIN public.chapters  c    ON c.id = m.chapter_id
    LEFT JOIN public.cities    ci   ON ci.id = m.city_id
    LEFT JOIN public.business_categories bcat ON bcat.id = bp.category_id
    WHERE m.user_id = auth.uid()
    LIMIT 1
  ) row;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- ============================================================
-- RPC: list active members for the public directory
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_active_directory()
RETURNS TABLE (
  member_id uuid,
  full_name text,
  email text,
  phone text,
  profile_picture text,
  chapter_name text,
  city_name text,
  business_name text,
  category_name text,
  business_city text,
  services text,
  website text,
  logo text,
  linkedin_url text,
  instagram_url text,
  facebook_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.id,
    m.full_name,
    m.email,
    m.phone,
    COALESCE(m.profile_picture, m.profile_image) AS profile_picture,
    c.name  AS chapter_name,
    ci.name AS city_name,
    bp.business_name,
    bcat.name AS category_name,
    bp.city  AS business_city,
    bp.services,
    bp.website,
    bp.logo,
    bp.linkedin_url,
    bp.instagram_url,
    bp.facebook_url
  FROM public.members m
  LEFT JOIN public.business_profiles bp ON bp.member_id = m.id
  LEFT JOIN public.chapters c   ON c.id = m.chapter_id
  LEFT JOIN public.cities   ci  ON ci.id = m.city_id
  LEFT JOIN public.business_categories bcat ON bcat.id = bp.category_id
  WHERE m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_active_directory() TO anon, authenticated;
