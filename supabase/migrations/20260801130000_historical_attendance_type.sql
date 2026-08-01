-- Historical Attendance: attendance records are snapshots of how a person
-- attended a specific meeting (Visitor vs Valuable Member) and must never
-- change when the person's current membership changes later.

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS attendance_type text;
UPDATE public.attendance SET attendance_type = 'valuable_member' WHERE attendance_type IS NULL;
ALTER TABLE public.attendance ALTER COLUMN attendance_type SET NOT NULL;
ALTER TABLE public.attendance ALTER COLUMN attendance_type SET DEFAULT 'valuable_member';
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_type_check;
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_type_check CHECK (attendance_type IN ('valuable_member', 'visitor'));

-- "Referred By" for a brand-new Visitor is a distinct concept from
-- invited_by_member_id (which specifically tracks who invited a Visitor to
-- become a Paid Member, and is validated as an active Paid Member). Referred
-- By can be any existing member and is captured at Visitor-creation time.
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS referred_by_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- mark_attendance: signature gains _attendance_type, so the old 3-arg
-- overload must be dropped first (Postgres resolves by full signature).
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.mark_attendance(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.mark_attendance(
  _meeting_id uuid,
  _member_id uuid,
  _method text,
  _attendance_type text DEFAULT 'valuable_member'
)
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
  IF _attendance_type NOT IN ('valuable_member', 'visitor') THEN
    RAISE EXCEPTION 'Invalid attendance type';
  END IF;
  IF _method = 'qr' AND _attendance_type <> 'valuable_member' THEN
    RAISE EXCEPTION 'QR check-in is only available for Valuable Members';
  END IF;

  SELECT * INTO v_meeting FROM public.meetings WHERE id = _meeting_id;
  IF v_meeting.id IS NULL THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;
  IF v_meeting.status <> 'live' THEN
    RAISE EXCEPTION 'Attendance can only be recorded while the meeting is live';
  END IF;

  IF _attendance_type = 'valuable_member' THEN
    SELECT full_name INTO v_member_name
    FROM public.members
    WHERE id = _member_id AND membership_type = 'paid_member' AND status = 'active';
    IF v_member_name IS NULL THEN
      RAISE EXCEPTION 'Only active Valuable Members can be marked present';
    END IF;
  ELSE
    SELECT full_name INTO v_member_name
    FROM public.members
    WHERE id = _member_id AND status = 'active';
    IF v_member_name IS NULL THEN
      RAISE EXCEPTION 'Member not found or inactive';
    END IF;
  END IF;

  INSERT INTO public.attendance(meeting_id, member_id, method, attendance_type)
  VALUES (_meeting_id, _member_id, _method, _attendance_type)
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
GRANT EXECUTE ON FUNCTION public.mark_attendance(uuid, uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- admin_add_attendance: same treatment — gains _attendance_type.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_add_attendance(uuid, uuid, timestamptz);

CREATE OR REPLACE FUNCTION public.admin_add_attendance(
  _meeting_id uuid,
  _member_id uuid,
  _check_in_time timestamptz DEFAULT NULL,
  _attendance_type text DEFAULT 'valuable_member'
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
  IF _attendance_type NOT IN ('valuable_member', 'visitor') THEN
    RAISE EXCEPTION 'Invalid attendance type';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meetings WHERE id = _meeting_id) THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;

  IF _attendance_type = 'valuable_member' THEN
    SELECT full_name INTO v_member_name
    FROM public.members
    WHERE id = _member_id AND membership_type = 'paid_member' AND status = 'active';
    IF v_member_name IS NULL THEN
      RAISE EXCEPTION 'Only active Valuable Members can be marked present';
    END IF;
  ELSE
    SELECT full_name INTO v_member_name
    FROM public.members
    WHERE id = _member_id AND status = 'active';
    IF v_member_name IS NULL THEN
      RAISE EXCEPTION 'Member not found or inactive';
    END IF;
  END IF;

  INSERT INTO public.attendance(meeting_id, member_id, method, attendance_type, check_in_time)
  VALUES (_meeting_id, _member_id, 'manual', _attendance_type, COALESCE(_check_in_time, now()))
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
GRANT EXECUTE ON FUNCTION public.admin_add_attendance(uuid, uuid, timestamptz, text) TO authenticated;

-- ---------------------------------------------------------------------
-- get_meeting_attendance: return type gains attendance_type, so it must be
-- dropped first (Postgres won't let CREATE OR REPLACE change row shape).
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_meeting_attendance(uuid);

CREATE OR REPLACE FUNCTION public.get_meeting_attendance(_meeting_id uuid)
RETURNS TABLE (
  attendance_id uuid, member_id uuid, member_name text, business_name text, phone text,
  check_in_time timestamptz, method text, attendance_type text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.member_id, m.full_name, bp1.business_name, m.phone, a.check_in_time, a.method, a.attendance_type
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

-- ---------------------------------------------------------------------
-- Search surface for "Attendance As: Visitor" — all registered people
-- (current Visitors AND current Valuable Members), since a current Valuable
-- Member may have attended an older meeting as a Visitor. Also doubles as
-- the "Referred By" dropdown source for the Add New Visitor form.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_all_members_for_attendance_search()
RETURNS TABLE (
  member_id uuid,
  full_name text,
  business_name text,
  phone text,
  profile_picture text,
  membership_type text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    m.id,
    m.full_name,
    bp1.business_name,
    m.phone,
    COALESCE(m.profile_picture, m.profile_image),
    COALESCE(m.membership_type, 'visitor')
  FROM public.members m
  LEFT JOIN LATERAL (
    SELECT business_name FROM public.business_profiles bp
    WHERE bp.member_id = m.id ORDER BY bp.created_at ASC LIMIT 1
  ) bp1 ON true
  WHERE public.is_attendance_staff() AND m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_all_members_for_attendance_search() TO authenticated;

-- ---------------------------------------------------------------------
-- Add New Visitor directly from the attendance screen: creates the member
-- (+ optional business profile) and immediately marks them present, all in
-- one transaction so the admin never has to leave the attendance page.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_visitor_and_check_in(
  _meeting_id uuid,
  _full_name text,
  _phone text DEFAULT NULL,
  _business_name text DEFAULT NULL,
  _city text DEFAULT NULL,
  _referred_by_member_id uuid DEFAULT NULL,
  _check_in_time timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_id uuid;
  v_full_name text;
  v_business_name text;
  v_city text;
  v_new public.attendance;
BEGIN
  IF NOT public.is_attendance_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  v_full_name := NULLIF(btrim(coalesce(_full_name, '')), '');
  IF v_full_name IS NULL THEN
    RAISE EXCEPTION 'Full Name is required';
  END IF;
  IF _referred_by_member_id IS NULL THEN
    RAISE EXCEPTION 'Referred By is required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = _referred_by_member_id) THEN
    RAISE EXCEPTION 'Referred By member not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meetings WHERE id = _meeting_id) THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;

  INSERT INTO public.members (full_name, phone, status, membership_type, referred_by_member_id)
  VALUES (v_full_name, NULLIF(btrim(coalesce(_phone, '')), ''), 'active', 'visitor', _referred_by_member_id)
  RETURNING id INTO v_member_id;

  v_business_name := NULLIF(btrim(coalesce(_business_name, '')), '');
  v_city := NULLIF(btrim(coalesce(_city, '')), '');
  IF v_business_name IS NOT NULL OR v_city IS NOT NULL THEN
    BEGIN
      INSERT INTO public.business_profiles (member_id, business_name, city)
      VALUES (v_member_id, v_business_name, v_city);
    EXCEPTION WHEN OTHERS THEN
      -- Best-effort only — never block Visitor creation on the business
      -- profile insert (e.g. an unexpected column constraint).
      NULL;
    END;
  END IF;

  INSERT INTO public.attendance (meeting_id, member_id, method, attendance_type, check_in_time)
  VALUES (_meeting_id, v_member_id, 'manual', 'visitor', COALESCE(_check_in_time, now()))
  RETURNING * INTO v_new;

  RETURN jsonb_build_object(
    'duplicate', false,
    'member_id', v_member_id,
    'member_name', v_full_name,
    'check_in_time', v_new.check_in_time
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_visitor_and_check_in(uuid, text, text, text, text, uuid, timestamptz) TO authenticated;
