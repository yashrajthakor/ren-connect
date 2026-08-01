-- Backdated meetings skip the Live flow entirely (attendance is entered
-- directly on the History Detail page while status stays 'upcoming'), so
-- they previously had no way to ever reach 'completed'. Allow
-- close_meeting_attendance to also finalize a backdated Upcoming meeting,
-- not just a Live one. A same-day-or-future Upcoming meeting still can't be
-- closed this way — it must go through Start Attendance / Close Attendance
-- as before, so a meeting can't be accidentally completed before it happens.
CREATE OR REPLACE FUNCTION public.close_meeting_attendance(_meeting_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meeting public.meetings;
BEGIN
  IF NOT public.is_attendance_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_meeting FROM public.meetings WHERE id = _meeting_id;
  IF v_meeting.id IS NULL THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;

  IF v_meeting.status = 'live' THEN
    UPDATE public.meetings SET status = 'completed' WHERE id = _meeting_id;
  ELSIF v_meeting.status = 'upcoming' AND v_meeting.meeting_date < CURRENT_DATE THEN
    UPDATE public.meetings SET status = 'completed' WHERE id = _meeting_id;
  ELSE
    RAISE EXCEPTION 'Only a Live meeting, or a backdated Upcoming meeting, can be closed';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.close_meeting_attendance(uuid) TO authenticated;
