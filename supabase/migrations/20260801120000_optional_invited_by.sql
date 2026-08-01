-- Make "Invited By" optional: founding members / direct joins may have no
-- inviter at all. NULL now means "None / Self" rather than being rejected.
-- Joining Date / Valid Through remain required — only Invited By's
-- not-null requirement and its dependent checks (self-invite, must-be-an-
-- active-Paid-Member) are relaxed to run only when an inviter IS selected.

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
    IF _joining_date IS NULL THEN
      RAISE EXCEPTION 'Joining Date is required when converting a Visitor to a Paid Member';
    END IF;
    IF _valid_through IS NULL THEN
      RAISE EXCEPTION 'Valid Through is required when converting a Visitor to a Paid Member';
    END IF;
    IF _valid_through < _joining_date THEN
      RAISE EXCEPTION 'Valid Through must be on or after the Joining Date';
    END IF;
    IF _invited_by_member_id IS NOT NULL THEN
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
  IF _joining_date IS NULL THEN
    RAISE EXCEPTION 'Joining Date is required';
  END IF;
  IF _valid_through IS NULL THEN
    RAISE EXCEPTION 'Valid Through is required';
  END IF;
  IF _valid_through < _joining_date THEN
    RAISE EXCEPTION 'Valid Through must be on or after the Joining Date';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.members WHERE id = _member_id AND membership_type = 'paid_member'
  ) THEN
    RAISE EXCEPTION 'Only Paid Members can have these details recorded';
  END IF;
  IF _invited_by_member_id IS NOT NULL THEN
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
  SET invited_by_member_id = _invited_by_member_id,
      paid_joining_date = _joining_date,
      paid_valid_through = _valid_through
  WHERE id = _member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_paid_member_details(uuid, uuid, date, date) TO authenticated;
