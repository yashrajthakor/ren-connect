-- Expose profile_type in self-service profile RPC (safe if 20260517000000 already ran without it)
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
