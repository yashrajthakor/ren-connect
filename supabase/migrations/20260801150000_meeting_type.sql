-- Meeting Type: categorize every meeting (Regular Meeting by default, or a
-- free-text custom type when "Other" is chosen). Stored as plain text so
-- custom types need no separate lookup table and automatically show up
-- wherever the app lists distinct meeting types (e.g. the attendance filter).

ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS meeting_type text NOT NULL DEFAULT 'Regular Meeting';

-- ---------------------------------------------------------------------
-- create_meeting / update_meeting gain _meeting_type — signature changes,
-- so the old overloads must be dropped first.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_meeting(text, date, time, text, text);

CREATE OR REPLACE FUNCTION public.create_meeting(
  _title text,
  _meeting_date date,
  _meeting_time time,
  _venue text DEFAULT NULL,
  _description text DEFAULT NULL,
  _meeting_type text DEFAULT 'Regular Meeting'
)
RETURNS public.meetings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.meetings;
  v_type text;
BEGIN
  IF NOT public.is_attendance_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF btrim(coalesce(_title, '')) = '' THEN
    RAISE EXCEPTION 'Meeting title is required';
  END IF;
  IF _meeting_date IS NULL THEN
    RAISE EXCEPTION 'Meeting date is required';
  END IF;
  IF _meeting_time IS NULL THEN
    RAISE EXCEPTION 'Start time is required';
  END IF;
  v_type := NULLIF(btrim(coalesce(_meeting_type, '')), '');
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'Meeting Type is required';
  END IF;

  INSERT INTO public.meetings(title, meeting_date, meeting_time, venue, description, status, created_by, meeting_type)
  VALUES (
    btrim(_title), _meeting_date, _meeting_time,
    NULLIF(btrim(coalesce(_venue, '')), ''),
    NULLIF(btrim(coalesce(_description, '')), ''),
    'upcoming', auth.uid(), v_type
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_meeting(text, date, time, text, text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.update_meeting(uuid, text, date, time, text, text);

CREATE OR REPLACE FUNCTION public.update_meeting(
  _meeting_id uuid,
  _title text,
  _meeting_date date,
  _meeting_time time,
  _venue text DEFAULT NULL,
  _description text DEFAULT NULL,
  _meeting_type text DEFAULT 'Regular Meeting'
)
RETURNS public.meetings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.meetings;
  v_type text;
BEGIN
  IF NOT public.is_attendance_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF btrim(coalesce(_title, '')) = '' THEN
    RAISE EXCEPTION 'Meeting title is required';
  END IF;
  IF _meeting_date IS NULL THEN
    RAISE EXCEPTION 'Meeting date is required';
  END IF;
  IF _meeting_time IS NULL THEN
    RAISE EXCEPTION 'Start time is required';
  END IF;
  v_type := NULLIF(btrim(coalesce(_meeting_type, '')), '');
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'Meeting Type is required';
  END IF;

  UPDATE public.meetings
  SET title = btrim(_title),
      meeting_date = _meeting_date,
      meeting_time = _meeting_time,
      venue = NULLIF(btrim(coalesce(_venue, '')), ''),
      description = NULLIF(btrim(coalesce(_description, '')), ''),
      meeting_type = v_type
  WHERE id = _meeting_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_meeting(uuid, text, date, time, text, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- list_meetings_for_admin / get_member_attendance_history gain
-- meeting_type in their return shape — must drop first.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.list_meetings_for_admin();

CREATE OR REPLACE FUNCTION public.list_meetings_for_admin()
RETURNS TABLE (
  id uuid, title text, meeting_date date, meeting_time time, venue text, description text,
  status text, created_at timestamptz, total_present bigint, meeting_type text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.title, m.meeting_date, m.meeting_time, m.venue, m.description, m.status, m.created_at,
         COALESCE((SELECT count(*) FROM public.attendance a WHERE a.meeting_id = m.id), 0) AS total_present,
         m.meeting_type
  FROM public.meetings m
  WHERE public.is_attendance_staff()
  ORDER BY m.meeting_date DESC, m.meeting_time DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_meetings_for_admin() TO authenticated;

DROP FUNCTION IF EXISTS public.get_member_attendance_history(uuid);

CREATE OR REPLACE FUNCTION public.get_member_attendance_history(_member_id uuid)
RETURNS TABLE (
  meeting_id uuid, title text, meeting_date date, meeting_type text, present boolean, check_in_time timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.title, m.meeting_date, m.meeting_type, (a.id IS NOT NULL) AS present, a.check_in_time
  FROM public.meetings m
  LEFT JOIN public.attendance a ON a.meeting_id = m.id AND a.member_id = _member_id
  WHERE public.is_attendance_staff() AND m.status = 'completed'
  ORDER BY m.meeting_date DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_member_attendance_history(uuid) TO authenticated;
