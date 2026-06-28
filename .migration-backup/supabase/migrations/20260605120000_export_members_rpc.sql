-- Admin export RPC: returns full member dataset (all statuses) for export.
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
  committee_badge text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.full_name,
    m.email,
    m.phone,
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
    m.committee_badge
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
