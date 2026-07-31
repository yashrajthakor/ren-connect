-- "Attendance Head" role: a narrow admin role that can manage ONLY the
-- Attendance module (Meetings, Live Attendance, Attendance History). It
-- must NOT gain access to Members, Leads, Sponsors, etc., so we introduce a
-- dedicated is_attendance_staff() check rather than adding this role to
-- is_admin_or_super() (which every other admin RPC/RLS policy relies on).

INSERT INTO public.roles (name)
SELECT 'attendance_head'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE lower(name) = 'attendance_head');

CREATE OR REPLACE FUNCTION public.is_attendance_head()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_current_user_role() = 'attendance_head';
$$;
GRANT EXECUTE ON FUNCTION public.is_attendance_head() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_attendance_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_or_super() OR public.is_attendance_head();
$$;
GRANT EXECUTE ON FUNCTION public.is_attendance_staff() TO authenticated;

-- ---------------------------------------------------------------------
-- Re-gate the Attendance module's tables + RPCs (signatures unchanged —
-- only the authorization check inside each function/policy changes).
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins manage meetings" ON public.meetings;
CREATE POLICY "Admins manage meetings" ON public.meetings FOR ALL TO authenticated
USING (public.is_attendance_staff()) WITH CHECK (public.is_attendance_staff());

DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance;
CREATE POLICY "Admins manage attendance" ON public.attendance FOR ALL TO authenticated
USING (public.is_attendance_staff()) WITH CHECK (public.is_attendance_staff());

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
  IF NOT public.is_attendance_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.meetings WHERE id = _meeting_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_meeting(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_meeting_attendance(_meeting_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_attendance_staff() THEN
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
  IF NOT public.is_attendance_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.meetings SET status = 'completed' WHERE id = _meeting_id AND status = 'live';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only a Live meeting can be closed';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.close_meeting_attendance(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_attendance(_meeting_id uuid, _member_id uuid, _method text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meeting public.meetings;
  v_member_name text;
  v_existing public.attendance;
  v_new public.attendance;
BEGIN
  IF NOT public.is_attendance_staff() THEN
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

CREATE OR REPLACE FUNCTION public.list_meetings_for_admin()
RETURNS TABLE (
  id uuid, title text, meeting_date date, meeting_time time, venue text, description text,
  status text, created_at timestamptz, total_present bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.title, m.meeting_date, m.meeting_time, m.venue, m.description, m.status, m.created_at,
         COALESCE((SELECT count(*) FROM public.attendance a WHERE a.meeting_id = m.id), 0) AS total_present
  FROM public.meetings m
  WHERE public.is_attendance_staff()
  ORDER BY m.meeting_date DESC, m.meeting_time DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_meetings_for_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_live_meeting()
RETURNS public.meetings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.meetings WHERE public.is_attendance_staff() AND status = 'live' LIMIT 1;
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
  WHERE public.is_attendance_staff() AND a.meeting_id = _meeting_id
  ORDER BY a.check_in_time DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_meeting_attendance(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_member_attendance_history(_member_id uuid)
RETURNS TABLE (
  meeting_id uuid, title text, meeting_date date, present boolean, check_in_time timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.title, m.meeting_date, (a.id IS NOT NULL) AS present, a.check_in_time
  FROM public.meetings m
  LEFT JOIN public.attendance a ON a.meeting_id = m.id AND a.member_id = _member_id
  WHERE public.is_attendance_staff() AND m.status = 'completed'
  ORDER BY m.meeting_date DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_member_attendance_history(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_add_attendance(
  _meeting_id uuid,
  _member_id uuid,
  _check_in_time timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_name text;
  v_new public.attendance;
  v_existing public.attendance;
BEGIN
  IF NOT public.is_attendance_staff() THEN
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

  INSERT INTO public.attendance(meeting_id, member_id, method, check_in_time)
  VALUES (_meeting_id, _member_id, 'manual', COALESCE(_check_in_time, now()))
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
GRANT EXECUTE ON FUNCTION public.admin_add_attendance(uuid, uuid, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_attendance(_attendance_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_attendance_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.attendance WHERE id = _attendance_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.remove_attendance(uuid) TO authenticated;

-- The Manual Check-in search (part of the Attendance module's own screens)
-- depends on this RPC to find Valuable Members — attendance_head needs it
-- too, even though the Valuable Members *pages* themselves stay off-limits.
-- Signature must match the currently-live function exactly (including
-- invited_by_member_id, added by 20260716120000_valuable_members_invited_by_id.sql)
-- or CREATE OR REPLACE fails with "cannot change return type of existing function".
DROP FUNCTION IF EXISTS public.list_valuable_members_for_admin();
CREATE OR REPLACE FUNCTION public.list_valuable_members_for_admin()
RETURNS TABLE (
  member_id uuid,
  full_name text,
  business_name text,
  phone text,
  profile_picture text,
  status text,
  membership_type text,
  paid_joining_date date,
  paid_valid_through date,
  invited_by_member_id uuid,
  invited_by_name text,
  categories text[]
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.id,
    m.full_name,
    bp1.business_name,
    m.phone,
    COALESCE(m.profile_picture, m.profile_image),
    m.status,
    m.membership_type,
    m.paid_joining_date,
    m.paid_valid_through,
    m.invited_by_member_id,
    inviter.full_name AS invited_by_name,
    COALESCE((
      SELECT array_agg(bc.name ORDER BY bpc.created_at)
      FROM public.business_profiles bp
      JOIN public.business_profile_categories bpc ON bpc.business_profile_id = bp.id
      JOIN public.business_categories bc ON bc.id = bpc.category_id
      WHERE bp.member_id = m.id
    ), ARRAY[]::text[]) AS categories
  FROM public.members m
  LEFT JOIN public.members inviter ON inviter.id = m.invited_by_member_id
  LEFT JOIN LATERAL (
    SELECT business_name FROM public.business_profiles bp
    WHERE bp.member_id = m.id
    ORDER BY bp.created_at ASC
    LIMIT 1
  ) bp1 ON true
  WHERE public.is_attendance_staff() AND m.membership_type = 'paid_member'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_valuable_members_for_admin() TO authenticated;
