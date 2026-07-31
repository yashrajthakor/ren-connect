-- Add invited_by_member_id to the Valuable Members RPC — needed so the
-- "Edit Membership" action can pre-fill the shared conversion dialog's
-- Invited By picker with the currently recorded inviter's *id* (not just
-- their display name).
DROP FUNCTION IF EXISTS public.list_valuable_members_for_admin();
CREATE OR REPLACE FUNCTION public.list_valuable_members_for_admin()
RETURNS TABLE (
  member_id uuid,
  full_name text,
  business_name text,
  phone text,
  profile_picture text,
  status text,
  membership_type text,
  paid_joining_date date,
  paid_valid_through date,
  invited_by_member_id uuid,
  invited_by_name text,
  categories text[]
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.id,
    m.full_name,
    bp1.business_name,
    m.phone,
    COALESCE(m.profile_picture, m.profile_image),
    m.status,
    m.membership_type,
    m.paid_joining_date,
    m.paid_valid_through,
    m.invited_by_member_id,
    inviter.full_name AS invited_by_name,
    COALESCE((
      SELECT array_agg(bc.name ORDER BY bpc.created_at)
      FROM public.business_profiles bp
      JOIN public.business_profile_categories bpc ON bpc.business_profile_id = bp.id
      JOIN public.business_categories bc ON bc.id = bpc.category_id
      WHERE bp.member_id = m.id
    ), ARRAY[]::text[]) AS categories
  FROM public.members m
  LEFT JOIN public.members inviter ON inviter.id = m.invited_by_member_id
  LEFT JOIN LATERAL (
    SELECT business_name FROM public.business_profiles bp
    WHERE bp.member_id = m.id
    ORDER BY bp.created_at ASC
    LIMIT 1
  ) bp1 ON true
  WHERE public.is_admin_or_super() AND m.membership_type = 'paid_member'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_valuable_members_for_admin() TO authenticated;
