-- Add phone number to the shared admin roster RPC so the reusable "Convert
-- to Paid Member" dialog can search Visitors/inviters by mobile number too
-- (needed by the new Valuable Members "+ New Valuable Member" flow). This
-- only ADDS a return column — existing callers (Admin → Members) that don't
-- read it are unaffected.
DROP FUNCTION IF EXISTS public.list_members_for_admin();
CREATE OR REPLACE FUNCTION public.list_members_for_admin()
RETURNS TABLE (
  member_id uuid, user_id uuid, full_name text, email text, phone text,
  chapter_name text, status text, committee_badge text,
  category_ids uuid[], categories text[], membership_type text,
  invited_by_member_id uuid, invited_by_name text, business_name text,
  paid_joining_date date, paid_valid_through date
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.user_id, m.full_name, m.email, m.phone,
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
         COALESCE(m.membership_type, 'visitor') AS membership_type,
         m.invited_by_member_id,
         inviter.full_name AS invited_by_name,
         bp1.business_name,
         m.paid_joining_date,
         m.paid_valid_through
  FROM public.members m
  LEFT JOIN public.chapters c ON c.id = m.chapter_id
  LEFT JOIN public.members inviter ON inviter.id = m.invited_by_member_id
  LEFT JOIN LATERAL (
    SELECT business_name FROM public.business_profiles bp
    WHERE bp.member_id = m.id
    ORDER BY bp.created_at ASC
    LIMIT 1
  ) bp1 ON true
  WHERE public.is_admin_or_super() AND m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_members_for_admin() TO authenticated;
