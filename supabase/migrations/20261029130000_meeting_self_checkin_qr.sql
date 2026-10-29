-- Per-meeting check-in QR: every meeting gets its own unguessable token.
-- Members scan the meeting's QR and mark their own attendance while the
-- meeting is Live. Existing flows (staff scanning a member's personal QR,
-- Manual Check-in, backdated adds) are unchanged.

ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS checkin_token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '');

CREATE UNIQUE INDEX IF NOT EXISTS meetings_checkin_token_idx ON public.meetings (checkin_token);

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_method_check;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_method_check CHECK (method IN ('qr', 'manual', 'self_qr'));

-- Member self check-in. Recorded as Valuable Member for current paid
-- members, otherwise as Visitor (same snapshot rule as manual check-in).
CREATE OR REPLACE FUNCTION public.self_check_in(_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_meeting public.meetings;
  v_member public.members;
  v_type text;
  v_new public.attendance;
  v_existing public.attendance;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to mark your attendance';
  END IF;

  SELECT * INTO v_meeting FROM public.meetings
  WHERE checkin_token = btrim(coalesce(_token, ''));
  IF v_meeting.id IS NULL THEN
    RAISE EXCEPTION 'This QR code is invalid or has been replaced. Please scan the latest meeting QR.';
  END IF;
  IF v_meeting.status = 'upcoming' THEN
    RAISE EXCEPTION 'Attendance for "%" has not started yet.', v_meeting.title;
  END IF;
  IF v_meeting.status <> 'live' THEN
    RAISE EXCEPTION 'Attendance for "%" is closed.', v_meeting.title;
  END IF;

  SELECT * INTO v_member FROM public.members
  WHERE user_id = v_uid AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1;
  IF v_member.id IS NULL THEN
    RAISE EXCEPTION 'Your membership is not active, so attendance can''t be marked. Please contact the attendance desk.';
  END IF;

  v_type := CASE WHEN v_member.membership_type = 'paid_member' THEN 'valuable_member' ELSE 'visitor' END;

  INSERT INTO public.attendance (meeting_id, member_id, method, attendance_type)
  VALUES (v_meeting.id, v_member.id, 'self_qr', v_type)
  ON CONFLICT (meeting_id, member_id) DO NOTHING
  RETURNING * INTO v_new;

  IF v_new.id IS NULL THEN
    SELECT * INTO v_existing FROM public.attendance
    WHERE meeting_id = v_meeting.id AND member_id = v_member.id;
  END IF;

  RETURN jsonb_build_object(
    'duplicate', v_new.id IS NULL,
    'member_id', v_member.id,
    'member_name', v_member.full_name,
    'check_in_time', COALESCE(v_new.check_in_time, v_existing.check_in_time),
    'meeting_title', v_meeting.title,
    'meeting_date', v_meeting.meeting_date,
    'meeting_venue', v_meeting.venue
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.self_check_in(text) TO authenticated;

-- Issue a fresh token so any previously printed/shared QR stops working.
CREATE OR REPLACE FUNCTION public.regenerate_meeting_checkin_token(_meeting_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token text;
BEGIN
  IF NOT public.is_attendance_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.meetings
  SET checkin_token = replace(gen_random_uuid()::text, '-', '')
  WHERE id = _meeting_id
  RETURNING checkin_token INTO v_token;
  IF v_token IS NULL THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;
  RETURN v_token;
END;
$$;
GRANT EXECUTE ON FUNCTION public.regenerate_meeting_checkin_token(uuid) TO authenticated;
