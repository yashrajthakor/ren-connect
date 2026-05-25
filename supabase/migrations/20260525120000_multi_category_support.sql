-- Multi-category support: many-to-many between business_profiles and business_categories.
-- Keeps business_profiles.category_id as the "primary" category for backward compatibility.

CREATE TABLE IF NOT EXISTS public.business_profile_categories (
  business_profile_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.business_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_profile_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_bpc_category ON public.business_profile_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_bpc_profile ON public.business_profile_categories(business_profile_id);

ALTER TABLE public.business_profile_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bpc select all auth" ON public.business_profile_categories;
CREATE POLICY "bpc select all auth" ON public.business_profile_categories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "bpc owner insert" ON public.business_profile_categories;
CREATE POLICY "bpc owner insert" ON public.business_profile_categories
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin_or_super() OR EXISTS (
      SELECT 1 FROM public.business_profiles bp
      JOIN public.members m ON m.id = bp.member_id
      WHERE bp.id = business_profile_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bpc owner delete" ON public.business_profile_categories;
CREATE POLICY "bpc owner delete" ON public.business_profile_categories
  FOR DELETE TO authenticated USING (
    public.is_admin_or_super() OR EXISTS (
      SELECT 1 FROM public.business_profiles bp
      JOIN public.members m ON m.id = bp.member_id
      WHERE bp.id = business_profile_id AND m.user_id = auth.uid()
    )
  );

-- Backfill from existing single category_id
INSERT INTO public.business_profile_categories (business_profile_id, category_id)
SELECT bp.id, bp.category_id
FROM public.business_profiles bp
WHERE bp.category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Keep business_profiles.category_id in sync with join table (primary = oldest)
CREATE OR REPLACE FUNCTION public.sync_business_profile_primary_category()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bp uuid;
  v_primary uuid;
BEGIN
  v_bp := COALESCE(NEW.business_profile_id, OLD.business_profile_id);
  SELECT category_id INTO v_primary
  FROM public.business_profile_categories
  WHERE business_profile_id = v_bp
  ORDER BY created_at ASC
  LIMIT 1;
  UPDATE public.business_profiles SET category_id = v_primary WHERE id = v_bp;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS tg_bpc_sync_primary ON public.business_profile_categories;
CREATE TRIGGER tg_bpc_sync_primary
AFTER INSERT OR DELETE ON public.business_profile_categories
FOR EACH ROW EXECUTE FUNCTION public.sync_business_profile_primary_category();

-- Caller replaces own categories
CREATE OR REPLACE FUNCTION public.set_my_business_categories(_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bp uuid;
BEGIN
  SELECT bp.id INTO v_bp
  FROM public.business_profiles bp
  JOIN public.members m ON m.id = bp.member_id
  WHERE m.user_id = auth.uid()
  LIMIT 1;
  IF v_bp IS NULL THEN RAISE EXCEPTION 'no business profile'; END IF;

  DELETE FROM public.business_profile_categories WHERE business_profile_id = v_bp;
  IF _ids IS NOT NULL AND array_length(_ids, 1) > 0 THEN
    INSERT INTO public.business_profile_categories (business_profile_id, category_id)
    SELECT v_bp, unnest(_ids)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.set_my_business_categories(uuid[]) TO authenticated;

-- Admin replaces categories for a member
CREATE OR REPLACE FUNCTION public.admin_set_member_categories(_member_id uuid, _ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bp uuid;
BEGIN
  IF NOT public.is_admin_or_super() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT id INTO v_bp FROM public.business_profiles WHERE member_id = _member_id LIMIT 1;
  IF v_bp IS NULL THEN RAISE EXCEPTION 'no business profile'; END IF;
  DELETE FROM public.business_profile_categories WHERE business_profile_id = v_bp;
  IF _ids IS NOT NULL AND array_length(_ids, 1) > 0 THEN
    INSERT INTO public.business_profile_categories (business_profile_id, category_id)
    SELECT v_bp, unnest(_ids)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_member_categories(uuid, uuid[]) TO authenticated;

-- Category usage stats (admin UI)
CREATE OR REPLACE FUNCTION public.get_category_usage()
RETURNS TABLE (id uuid, name text, member_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT bc.id, bc.name, COUNT(bpc.business_profile_id)::bigint
  FROM public.business_categories bc
  LEFT JOIN public.business_profile_categories bpc ON bpc.category_id = bc.id
  GROUP BY bc.id, bc.name
  ORDER BY bc.name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_category_usage() TO authenticated;

-- get_my_profile + category_ids[] + category_names[]
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_jsonb(row) FROM (
    SELECT
      m.id AS member_id, m.user_id, m.full_name, m.email, m.phone,
      m.profile_picture, m.profile_image, m.status,
      m.chapter_id, m.city_id, m.committee_badge,
      c.name AS chapter_name, ci.name AS city_name,
      bp.id AS business_profile_id, bp.business_name, bp.category_id,
      bp.profile_type,
      bp.city AS business_city, bp.state AS business_state, bp.pincode,
      bp.address AS business_address, bp.website, bp.services, bp.gst_number,
      bp.logo, bp.visiting_card,
      bp.linkedin_url, bp.instagram_url, bp.facebook_url,
      bcat.name AS category_name,
      COALESCE((
        SELECT array_agg(bpc.category_id ORDER BY bpc.created_at)
        FROM public.business_profile_categories bpc
        WHERE bpc.business_profile_id = bp.id
      ), ARRAY[]::uuid[]) AS category_ids,
      COALESCE((
        SELECT array_agg(bc2.name ORDER BY bpc.created_at)
        FROM public.business_profile_categories bpc
        JOIN public.business_categories bc2 ON bc2.id = bpc.category_id
        WHERE bpc.business_profile_id = bp.id
      ), ARRAY[]::text[]) AS category_names
    FROM public.members m
    LEFT JOIN public.business_profiles bp ON bp.member_id = m.id
    LEFT JOIN public.chapters c   ON c.id = m.chapter_id
    LEFT JOIN public.cities   ci  ON ci.id = m.city_id
    LEFT JOIN public.business_categories bcat ON bcat.id = bp.category_id
    WHERE m.user_id = auth.uid()
    LIMIT 1
  ) row;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

DROP FUNCTION IF EXISTS public.list_active_directory();
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
  category_ids uuid[],
  categories text[],
  business_city text,
  services text,
  website text,
  logo text,
  linkedin_url text,
  instagram_url text,
  facebook_url text,
  committee_badge text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.id, m.full_name, m.email, m.phone,
    COALESCE(m.profile_picture, m.profile_image) AS profile_picture,
    c.name, ci.name, bp.business_name, bcat.name,
    COALESCE((
      SELECT array_agg(bpc.category_id ORDER BY bpc.created_at)
      FROM public.business_profile_categories bpc
      WHERE bpc.business_profile_id = bp.id
    ), CASE WHEN bp.category_id IS NULL THEN ARRAY[]::uuid[] ELSE ARRAY[bp.category_id] END) AS category_ids,
    COALESCE((
      SELECT array_agg(bc2.name ORDER BY bpc.created_at)
      FROM public.business_profile_categories bpc
      JOIN public.business_categories bc2 ON bc2.id = bpc.category_id
      WHERE bpc.business_profile_id = bp.id
    ), CASE WHEN bcat.name IS NULL THEN ARRAY[]::text[] ELSE ARRAY[bcat.name] END) AS categories,
    bp.city, bp.services, bp.website, bp.logo,
    bp.linkedin_url, bp.instagram_url, bp.facebook_url,
    m.committee_badge
  FROM public.members m
  LEFT JOIN public.business_profiles bp ON bp.member_id = m.id
  LEFT JOIN public.chapters c   ON c.id = m.chapter_id
  LEFT JOIN public.cities   ci  ON ci.id = m.city_id
  LEFT JOIN public.business_categories bcat ON bcat.id = bp.category_id
  WHERE m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_active_directory() TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_members_by_user_ids(uuid[]);
CREATE OR REPLACE FUNCTION public.get_members_by_user_ids(_user_ids uuid[])
RETURNS TABLE (
  user_id uuid, name text, business text,
  category text, categories text[], phone text,
  avatar_url text, city text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.user_id, m.name, m.business, m.category,
    COALESCE((
      SELECT array_agg(bc.name ORDER BY bpc.created_at)
      FROM public.business_profiles bp
      JOIN public.business_profile_categories bpc ON bpc.business_profile_id = bp.id
      JOIN public.business_categories bc ON bc.id = bpc.category_id
      WHERE bp.member_id = m.id
    ), CASE WHEN m.category IS NULL THEN ARRAY[]::text[] ELSE ARRAY[m.category] END) AS categories,
    m.phone, m.avatar_url, m.city
  FROM public.members m WHERE m.user_id = ANY(_user_ids);
$$;
GRANT EXECUTE ON FUNCTION public.get_members_by_user_ids(uuid[]) TO authenticated;

DROP FUNCTION IF EXISTS public.list_active_members_for_leads();
CREATE OR REPLACE FUNCTION public.list_active_members_for_leads()
RETURNS TABLE (
  id uuid, user_id uuid, name text, business text,
  category text, categories text[],
  city text, avatar_url text, committee_badge text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.id, m.user_id, m.name, m.business, m.category,
    COALESCE((
      SELECT array_agg(bc.name ORDER BY bpc.created_at)
      FROM public.business_profiles bp
      JOIN public.business_profile_categories bpc ON bpc.business_profile_id = bp.id
      JOIN public.business_categories bc ON bc.id = bpc.category_id
      WHERE bp.member_id = m.id
    ), CASE WHEN m.category IS NULL THEN ARRAY[]::text[] ELSE ARRAY[m.category] END) AS categories,
    m.city, m.avatar_url, m.committee_badge
  FROM public.members m
  WHERE m.status = 'active' AND m.user_id IS NOT NULL AND m.user_id <> auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.list_active_members_for_leads() TO authenticated;

DROP FUNCTION IF EXISTS public.list_members_for_admin();
CREATE OR REPLACE FUNCTION public.list_members_for_admin()
RETURNS TABLE (
  member_id uuid, user_id uuid, full_name text, email text,
  chapter_name text, status text, committee_badge text,
  category_ids uuid[], categories text[]
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.user_id, m.full_name, m.email,
         c.name AS chapter_name, m.status, m.committee_badge,
         COALESCE((
           SELECT array_agg(bpc.category_id ORDER BY bpc.created_at)
           FROM public.business_profiles bp
           JOIN public.business_profile_categories bpc ON bpc.business_profile_id = bp.id
           WHERE bp.member_id = m.id
         ), ARRAY[]::uuid[]),
         COALESCE((
           SELECT array_agg(bc.name ORDER BY bpc.created_at)
           FROM public.business_profiles bp
           JOIN public.business_profile_categories bpc ON bpc.business_profile_id = bp.id
           JOIN public.business_categories bc ON bc.id = bpc.category_id
           WHERE bp.member_id = m.id
         ), ARRAY[]::text[])
  FROM public.members m
  LEFT JOIN public.chapters c ON c.id = m.chapter_id
  WHERE public.is_admin_or_super() AND m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_members_for_admin() TO authenticated;
