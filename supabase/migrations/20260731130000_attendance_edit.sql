-- Allow admins to correct attendance after the fact (add a missed check-in,
-- remove a mistaken one) regardless of meeting status. Distinct from
-- mark_attendance, which is the live-scan/manual-check-in path and stays
-- gated to status = 'live'.

CREATE OR REPLACE FUNCTION public.admin_add_attendance(_meeting_id uuid, _member_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_name text;
  v_new public.attendance;
  v_existing public.attendance;
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meetings WHERE id = _meeting_id) THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;

  SELECT full_name INTO v_member_name
  FROM public.members
  WHERE id = _member_id AND membership_type = 'paid_member' AND status = 'active';
  IF v_member_name IS NULL THEN
    RAISE EXCEPTION 'Only active Valuable Members can be marked present';
  END IF;

  INSERT INTO public.attendance(meeting_id, member_id, method)
  VALUES (_meeting_id, _member_id, 'manual')
  ON CONFLICT (meeting_id, member_id) DO NOTHING
  RETURNING * INTO v_new;

  IF v_new.id IS NULL THEN
    SELECT * INTO v_existing FROM public.attendance WHERE meeting_id = _meeting_id AND member_id = _member_id;
    RETURN jsonb_build_object(
      'duplicate', true,
      'member_id', _member_id,
      'member_name', v_member_name,
      'check_in_time', v_existing.check_in_time
    );
  END IF;

  RETURN jsonb_build_object(
    'duplicate', false,
    'member_id', _member_id,
    'member_name', v_member_name,
    'check_in_time', v_new.check_in_time
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_add_attendance(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_attendance(_attendance_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.attendance WHERE id = _attendance_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.remove_attendance(uuid) TO authenticated;
