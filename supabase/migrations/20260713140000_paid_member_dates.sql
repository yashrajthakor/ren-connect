-- Paid Member conversion now also requires Joining Date and Valid Through
-- (for renewal/expiry tracking and future reminders).
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS paid_joining_date date,
  ADD COLUMN IF NOT EXISTS paid_valid_through date;

CREATE INDEX IF NOT EXISTS members_paid_valid_through_idx ON public.members(paid_valid_through);

-- Visitor → Paid Member conversion: Invited By, Joining Date and Valid
-- Through are all mandatory for a genuine conversion. Downgrading to
-- Visitor needs none of them and preserves the historical record.
CREATE OR REPLACE FUNCTION public.set_membership_type(
  _member_id uuid,
  _type text,
  _invited_by_member_id uuid DEFAULT NULL,
  _joining_date date DEFAULT NULL,
  _valid_through date DEFAULT NULL
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
    IF _joining_date IS NULL THEN
      RAISE EXCEPTION 'Joining Date is required when converting a Visitor to a Paid Member';
    END IF;
    IF _valid_through IS NULL THEN
      RAISE EXCEPTION 'Valid Through is required when converting a Visitor to a Paid Member';
    END IF;
    IF _valid_through < _joining_date THEN
      RAISE EXCEPTION 'Valid Through must be on or after the Joining Date';
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
      END,
      paid_joining_date = CASE
        WHEN _type = 'paid_member' AND v_current_type IS DISTINCT FROM 'paid_member'
          THEN _joining_date
        ELSE paid_joining_date
      END,
      paid_valid_through = CASE
        WHEN _type = 'paid_member' AND v_current_type IS DISTINCT FROM 'paid_member'
          THEN _valid_through
        ELSE paid_valid_through
      END
  WHERE id = _member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_membership_type(uuid, text, uuid, date, date) TO authenticated;

-- The previous 3-arg overload is superseded by the 5-arg version above —
-- drop it so calls are never ambiguous (same "best candidate" issue as
-- before if both signatures existed at once).
DROP FUNCTION IF EXISTS public.set_membership_type(uuid, text, uuid);

-- Replace the narrower set_member_invited_by with a general-purpose editor
-- for all three Paid Member fields, used both to backfill history on
-- existing Paid Members and for renewals (updating Valid Through).
DROP FUNCTION IF EXISTS public.set_member_invited_by(uuid, uuid);

CREATE OR REPLACE FUNCTION public.set_paid_member_details(
  _member_id uuid,
  _invited_by_member_id uuid,
  _joining_date date,
  _valid_through date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _invited_by_member_id IS NULL THEN
    RAISE EXCEPTION 'Invited By is required';
  END IF;
  IF _joining_date IS NULL THEN
    RAISE EXCEPTION 'Joining Date is required';
  END IF;
  IF _valid_through IS NULL THEN
    RAISE EXCEPTION 'Valid Through is required';
  END IF;
  IF _valid_through < _joining_date THEN
    RAISE EXCEPTION 'Valid Through must be on or after the Joining Date';
  END IF;
  IF _invited_by_member_id = _member_id THEN
    RAISE EXCEPTION 'A member cannot invite themselves';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.members WHERE id = _member_id AND membership_type = 'paid_member'
  ) THEN
    RAISE EXCEPTION 'Only Paid Members can have these details recorded';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.members
    WHERE id = _invited_by_member_id AND membership_type = 'paid_member' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Selected inviter must be an active Paid Member';
  END IF;

  UPDATE public.members
  SET invited_by_member_id = _invited_by_member_id,
      paid_joining_date = _joining_date,
      paid_valid_through = _valid_through
  WHERE id = _member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_paid_member_details(uuid, uuid, date, date) TO authenticated;

-- Surface the new dates in the admin roster query.
DROP FUNCTION IF EXISTS public.list_members_for_admin();
CREATE OR REPLACE FUNCTION public.list_members_for_admin()
RETURNS TABLE (
  member_id uuid, user_id uuid, full_name text, email text,
  chapter_name text, status text, committee_badge text,
  category_ids uuid[], categories text[], membership_type text,
  invited_by_member_id uuid, invited_by_name text, business_name text,
  paid_joining_date date, paid_valid_through date
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
