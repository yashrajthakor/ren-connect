-- Committee badge support for members

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS committee_badge text;

-- helper: is current user admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND lower(r.name) IN ('admin','super_admin')
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin_or_super() TO authenticated;

-- RPC: assign / clear committee badge (admin or super_admin only)
CREATE OR REPLACE FUNCTION public.set_committee_badge(_member_id uuid, _badge text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Only admin or super_admin can update committee badges';
  END IF;
  UPDATE public.members
     SET committee_badge = NULLIF(trim(_badge), '')
   WHERE id = _member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_committee_badge(uuid, text) TO authenticated;

-- Update list_members_with_roles to include committee_badge
CREATE OR REPLACE FUNCTION public.list_members_with_roles()
RETURNS TABLE (
  member_id uuid, user_id uuid, full_name text, email text,
  chapter_id uuid, chapter_name text, status text,
  role_id uuid, role_name text, committee_badge text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.user_id, m.full_name, m.email, m.chapter_id,
         c.name AS chapter_name, m.status, r.id AS role_id, r.name AS role_name,
         m.committee_badge
  FROM public.members m
  LEFT JOIN public.user_roles ur ON ur.user_id = m.user_id
  LEFT JOIN public.roles r ON r.id = ur.role_id
  LEFT JOIN public.chapters c ON c.id = m.chapter_id
  WHERE public.is_super_admin() AND m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_members_with_roles() TO authenticated;

-- Update directory RPC to include committee_badge
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
  facebook_url text,
  committee_badge text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.id, m.full_name, m.email, m.phone,
    COALESCE(m.profile_picture, m.profile_image) AS profile_picture,
    c.name, ci.name, bp.business_name, bcat.name,
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

-- Update get_my_profile to include committee_badge
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
      bp.city AS business_city, bp.state AS business_state, bp.pincode,
      bp.address AS business_address, bp.website, bp.services, bp.gst_number,
      bp.logo, bp.visiting_card,
      bp.linkedin_url, bp.instagram_url, bp.facebook_url,
      bcat.name AS category_name
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

-- RPC for admin & super_admin to view/manage committee badges
CREATE OR REPLACE FUNCTION public.list_members_for_admin()
RETURNS TABLE (
  member_id uuid, user_id uuid, full_name text, email text,
  chapter_name text, status text, committee_badge text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.user_id, m.full_name, m.email,
         c.name AS chapter_name, m.status, m.committee_badge
  FROM public.members m
  LEFT JOIN public.chapters c ON c.id = m.chapter_id
  WHERE public.is_admin_or_super() AND m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_members_for_admin() TO authenticated;
