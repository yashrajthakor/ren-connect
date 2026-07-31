-- Meeting Attendance Management module: meetings + attendance tables, plus
-- admin-gated RPCs for the full create/start/scan/close/history flow.
-- Distinct from the existing `one_to_one_meetings` table (1:1 Feed) — no
-- relation between the two.

CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  meeting_date date NOT NULL,
  meeting_time time NOT NULL,
  venue text,
  description text,
  status text NOT NULL DEFAULT 'upcoming',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings
  DROP CONSTRAINT IF EXISTS meetings_status_check;
ALTER TABLE public.meetings
  ADD CONSTRAINT meetings_status_check CHECK (status IN ('upcoming', 'live', 'completed'));

-- Only one meeting can be Live at a time — enforced at the DB level so it
-- holds even under concurrent requests, not just via the RPC check below.
CREATE UNIQUE INDEX IF NOT EXISTS meetings_one_live_idx ON public.meetings (status) WHERE status = 'live';

CREATE INDEX IF NOT EXISTS meetings_date_idx ON public.meetings (meeting_date DESC, meeting_time DESC);

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  check_in_time timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, member_id)
);

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_method_check;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_method_check CHECK (method IN ('qr', 'manual'));

CREATE INDEX IF NOT EXISTS attendance_meeting_idx ON public.attendance (meeting_id, check_in_time DESC);
CREATE INDEX IF NOT EXISTS attendance_member_idx ON public.attendance (member_id);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage meetings" ON public.meetings;
CREATE POLICY "Admins manage meetings" ON public.meetings FOR ALL TO authenticated
USING (public.is_admin_or_super()) WITH CHECK (public.is_admin_or_super());

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance;
CREATE POLICY "Admins manage attendance" ON public.attendance FOR ALL TO authenticated
USING (public.is_admin_or_super()) WITH CHECK (public.is_admin_or_super());

-- ---------------------------------------------------------------------
-- Meeting CRUD
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_meeting(
  _title text,
  _meeting_date date,
  _meeting_time time,
  _venue text DEFAULT NULL,
  _description text DEFAULT NULL
)
RETURNS public.meetings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.meetings;
BEGIN
  IF NOT public.is_admin_or_super() THEN
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

  INSERT INTO public.meetings(title, meeting_date, meeting_time, venue, description, status, created_by)
  VALUES (
    btrim(_title), _meeting_date, _meeting_time,
    NULLIF(btrim(coalesce(_venue, '')), ''),
    NULLIF(btrim(coalesce(_description, '')), ''),
    'upcoming', auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_meeting(text, date, time, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_meeting(
  _meeting_id uuid,
  _title text,
  _meeting_date date,
  _meeting_time time,
  _venue text DEFAULT NULL,
  _description text DEFAULT NULL
)
RETURNS public.meetings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.meetings;
BEGIN
  IF NOT public.is_admin_or_super() THEN
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

  UPDATE public.meetings
  SET title = btrim(_title),
      meeting_date = _meeting_date,
      meeting_time = _meeting_time,
      venue = NULLIF(btrim(coalesce(_venue, '')), ''),
      description = NULLIF(btrim(coalesce(_description, '')), '')
  WHERE id = _meeting_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_meeting(uuid, text, date, time, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_meeting(_meeting_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.meetings WHERE id = _meeting_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_meeting(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- Attendance lifecycle
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.start_meeting_attendance(_meeting_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF EXISTS (SELECT 1 FROM public.meetings WHERE status = 'live' AND id <> _meeting_id) THEN
    RAISE EXCEPTION 'Another meeting is already live. Close it before starting a new one.';
  END IF;

  UPDATE public.meetings SET status = 'live' WHERE id = _meeting_id AND status = 'upcoming';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only an Upcoming meeting can be started';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.start_meeting_attendance(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.close_meeting_attendance(_meeting_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.meetings SET status = 'completed' WHERE id = _meeting_id AND status = 'live';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only a Live meeting can be closed';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.close_meeting_attendance(uuid) TO authenticated;

-- Records a check-in (QR or Manual). Returns a JSON result instead of
-- raising on a repeat scan/select, since "already checked in" is an
-- expected, common flow the UI needs to display gracefully rather than an
-- error. Race-safe via ON CONFLICT DO NOTHING against the UNIQUE constraint.
CREATE OR REPLACE FUNCTION public.mark_attendance(_meeting_id uuid, _member_id uuid, _method text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meeting public.meetings;
  v_member_name text;
  v_existing public.attendance;
  v_new public.attendance;
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _method NOT IN ('qr', 'manual') THEN
    RAISE EXCEPTION 'Invalid check-in method';
  END IF;

  SELECT * INTO v_meeting FROM public.meetings WHERE id = _meeting_id;
  IF v_meeting.id IS NULL THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;
  IF v_meeting.status <> 'live' THEN
    RAISE EXCEPTION 'Attendance can only be recorded while the meeting is live';
  END IF;

  SELECT full_name INTO v_member_name
  FROM public.members
  WHERE id = _member_id AND membership_type = 'paid_member' AND status = 'active';
  IF v_member_name IS NULL THEN
    RAISE EXCEPTION 'Only active Valuable Members can be marked present';
  END IF;

  INSERT INTO public.attendance(meeting_id, member_id, method)
  VALUES (_meeting_id, _member_id, _method)
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
GRANT EXECUTE ON FUNCTION public.mark_attendance(uuid, uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- Read APIs
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_meetings_for_admin()
RETURNS TABLE (
  id uuid, title text, meeting_date date, meeting_time time, venue text, description text,
  status text, created_at timestamptz, total_present bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.title, m.meeting_date, m.meeting_time, m.venue, m.description, m.status, m.created_at,
         COALESCE((SELECT count(*) FROM public.attendance a WHERE a.meeting_id = m.id), 0) AS total_present
  FROM public.meetings m
  WHERE public.is_admin_or_super()
  ORDER BY m.meeting_date DESC, m.meeting_time DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_meetings_for_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_live_meeting()
RETURNS public.meetings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.meetings WHERE public.is_admin_or_super() AND status = 'live' LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_live_meeting() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_meeting_attendance(_meeting_id uuid)
RETURNS TABLE (
  attendance_id uuid, member_id uuid, member_name text, business_name text, phone text,
  check_in_time timestamptz, method text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.member_id, m.full_name, bp1.business_name, m.phone, a.check_in_time, a.method
  FROM public.attendance a
  JOIN public.members m ON m.id = a.member_id
  LEFT JOIN LATERAL (
    SELECT business_name FROM public.business_profiles bp
    WHERE bp.member_id = m.id ORDER BY bp.created_at ASC LIMIT 1
  ) bp1 ON true
  WHERE public.is_admin_or_super() AND a.meeting_id = _meeting_id
  ORDER BY a.check_in_time DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_meeting_attendance(uuid) TO authenticated;

-- Present/Absent per completed meeting for one member (Valuable Member
-- profile's "View Attendance History") — no aggregation/analytics, just a
-- plain list the frontend can count/render directly.
CREATE OR REPLACE FUNCTION public.get_member_attendance_history(_member_id uuid)
RETURNS TABLE (
  meeting_id uuid, title text, meeting_date date, present boolean, check_in_time timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.title, m.meeting_date, (a.id IS NOT NULL) AS present, a.check_in_time
  FROM public.meetings m
  LEFT JOIN public.attendance a ON a.meeting_id = m.id AND a.member_id = _member_id
  WHERE public.is_admin_or_super() AND m.status = 'completed'
  ORDER BY m.meeting_date DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_member_attendance_history(uuid) TO authenticated;
