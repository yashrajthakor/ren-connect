-- Fix "Could not choose the best candidate function" error: an earlier
-- migration added a 3-arg overload of set_membership_type via CREATE OR
-- REPLACE, but Postgres identifies functions by their full signature, so
-- the original 2-arg version kept existing alongside it. Calls with only
-- (_member_id, _type) became ambiguous between the two. Drop the stale
-- 2-arg overload so the 3-arg version (with a DEFAULT NULL third param) is
-- the sole candidate.
DROP FUNCTION IF EXISTS public.set_membership_type(uuid, text);

-- Also let admins set/change "Invited By" for a member who is already a
-- Paid Member (e.g. to backfill history, or fix a mistaken selection),
-- without re-running the Visitor→Paid conversion flow.
CREATE OR REPLACE FUNCTION public.set_member_invited_by(_member_id uuid, _invited_by_member_id uuid)
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
  IF _invited_by_member_id = _member_id THEN
    RAISE EXCEPTION 'A member cannot invite themselves';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.members WHERE id = _member_id AND membership_type = 'paid_member'
  ) THEN
    RAISE EXCEPTION 'Only Paid Members can have an inviter recorded';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.members
    WHERE id = _invited_by_member_id AND membership_type = 'paid_member' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Selected inviter must be an active Paid Member';
  END IF;

  UPDATE public.members SET invited_by_member_id = _invited_by_member_id WHERE id = _member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_member_invited_by(uuid, uuid) TO authenticated;
