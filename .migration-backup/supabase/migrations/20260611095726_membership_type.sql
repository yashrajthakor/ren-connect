-- Membership classification: visitor (default) | paid_member
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS membership_type text NOT NULL DEFAULT 'visitor';

ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_membership_type_check;
ALTER TABLE public.members
  ADD CONSTRAINT members_membership_type_check
  CHECK (membership_type IN ('visitor', 'paid_member'));

CREATE INDEX IF NOT EXISTS members_membership_type_idx
  ON public.members(membership_type);

CREATE OR REPLACE FUNCTION public.set_membership_type(_member_id uuid, _type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _type NOT IN ('visitor', 'paid_member') THEN
    RAISE EXCEPTION 'Invalid membership type: %', _type;
  END IF;
  UPDATE public.members SET membership_type = _type WHERE id = _member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_membership_type(uuid, text) TO authenticated;

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
  committee_badge text,
  membership_type text
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
    m.committee_badge,
    COALESCE(m.membership_type, 'visitor') AS membership_type
  FROM public.members m
  LEFT JOIN public.business_profiles bp ON bp.member_id = m.id
  LEFT JOIN public.chapters c   ON c.id = m.chapter_id
  LEFT JOIN public.cities   ci  ON ci.id = m.city_id
  LEFT JOIN public.business_categories bcat ON bcat.id = bp.category_id
  WHERE m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_active_directory() TO anon, authenticated;

DROP FUNCTION IF EXISTS public.list_members_for_admin();
CREATE OR REPLACE FUNCTION public.list_members_for_admin()
RETURNS TABLE (
  member_id uuid, user_id uuid, full_name text, email text,
  chapter_name text, status text, committee_badge text,
  category_ids uuid[], categories text[], membership_type text
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
         ), ARRAY[]::text[]),
         COALESCE(m.membership_type, 'visitor') AS membership_type
  FROM public.members m
  LEFT JOIN public.chapters c ON c.id = m.chapter_id
  WHERE public.is_admin_or_super() AND m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_members_for_admin() TO authenticated;

DROP FUNCTION IF EXISTS public.export_members_for_admin();
CREATE OR REPLACE FUNCTION public.export_members_for_admin()
RETURNS TABLE (
  member_id uuid,
  full_name text,
  email text,
  phone text,
  city text,
  categories text[],
  services text,
  referral_person text,
  join_date timestamptz,
  status text,
  chapter_name text,
  committee_badge text,
  membership_type text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    m.id, m.full_name, m.email, m.phone,
    COALESCE(bp.city, '') AS city,
    COALESCE((
      SELECT array_agg(bc.name ORDER BY bpc.created_at)
      FROM public.business_profile_categories bpc
      JOIN public.business_categories bc ON bc.id = bpc.category_id
      WHERE bpc.business_profile_id = bp.id
    ), ARRAY[]::text[]) AS categories,
    COALESCE(bp.services, '') AS services,
    COALESCE(bp.referral_person, '') AS referral_person,
    m.created_at AS join_date,
    m.status,
    c.name AS chapter_name,
    m.committee_badge,
    COALESCE(m.membership_type, 'visitor') AS membership_type
  FROM public.members m
  LEFT JOIN public.chapters c ON c.id = m.chapter_id
  LEFT JOIN LATERAL (
    SELECT * FROM public.business_profiles bp
    WHERE bp.member_id = m.id
    ORDER BY bp.created_at ASC
    LIMIT 1
  ) bp ON true
  WHERE public.is_admin_or_super()
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.export_members_for_admin() TO authenticated;
