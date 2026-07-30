-- Track which existing Paid Member invited a Visitor to become a Paid
-- Member, for conversion reporting ("who invited the most new Paid
-- Members").
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS invited_by_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS members_invited_by_idx ON public.members(invited_by_member_id);

-- Require an active Paid Member inviter whenever a member is actually
-- transitioning from Visitor to Paid Member; downgrading back to Visitor
-- needs no inviter and preserves the historical invited_by record.
CREATE OR REPLACE FUNCTION public.set_membership_type(
  _member_id uuid,
  _type text,
  _invited_by_member_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_type text;
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _type NOT IN ('visitor', 'paid_member') THEN
    RAISE EXCEPTION 'Invalid membership type: %', _type;
  END IF;

  SELECT COALESCE(membership_type, 'visitor') INTO v_current_type
  FROM public.members WHERE id = _member_id;

  IF _type = 'paid_member' AND v_current_type IS DISTINCT FROM 'paid_member' THEN
    IF _invited_by_member_id IS NULL THEN
      RAISE EXCEPTION 'Invited By is required when converting a Visitor to a Paid Member';
    END IF;
    IF _invited_by_member_id = _member_id THEN
      RAISE EXCEPTION 'A member cannot invite themselves';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.members
      WHERE id = _invited_by_member_id AND membership_type = 'paid_member' AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Selected inviter must be an active Paid Member';
    END IF;
  END IF;

  UPDATE public.members
  SET membership_type = _type,
      membership_type_changed_at = CASE
        WHEN membership_type IS DISTINCT FROM _type THEN now()
        ELSE membership_type_changed_at
      END,
      invited_by_member_id = CASE
        WHEN _type = 'paid_member' AND v_current_type IS DISTINCT FROM 'paid_member'
          THEN _invited_by_member_id
        ELSE invited_by_member_id
      END
  WHERE id = _member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_membership_type(uuid, text, uuid) TO authenticated;

-- Surface invited_by and business_name alongside the roster so the admin UI
-- can show/search on them and future reporting queries have ready-made
-- fields to display.
DROP FUNCTION IF EXISTS public.list_members_for_admin();
CREATE OR REPLACE FUNCTION public.list_members_for_admin()
RETURNS TABLE (
  member_id uuid, user_id uuid, full_name text, email text,
  chapter_name text, status text, committee_badge text,
  category_ids uuid[], categories text[], membership_type text,
  invited_by_member_id uuid, invited_by_name text, business_name text
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
         COALESCE(m.membership_type, 'visitor') AS membership_type,
         m.invited_by_member_id,
         inviter.full_name AS invited_by_name,
         bp1.business_name
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
