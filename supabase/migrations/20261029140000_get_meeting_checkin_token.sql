-- The attendance module reads meetings only through SECURITY DEFINER RPCs
-- (authenticated has no table grant), so the QR dialog needs one too.
CREATE OR REPLACE FUNCTION public.get_meeting_checkin_token(_meeting_id uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token text;
BEGIN
  IF NOT public.is_attendance_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT checkin_token INTO v_token FROM public.meetings WHERE id = _meeting_id;
  IF v_token IS NULL THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;
  RETURN v_token;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_meeting_checkin_token(uuid) TO authenticated;
