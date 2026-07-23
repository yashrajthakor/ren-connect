-- Admin dashboard KPI statistics: track when a member was upgraded to Paid
-- (so "New Paid Members" can be date-filtered) and add a single aggregate
-- RPC that returns every KPI for a given date range in one round trip.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS membership_type_changed_at timestamptz;

-- Stamp the change timestamp whenever membership_type actually changes.
CREATE OR REPLACE FUNCTION public.set_membership_type(_member_id uuid, _type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _type NOT IN ('visitor', 'paid_member') THEN
    RAISE EXCEPTION 'Invalid membership type: %', _type;
  END IF;
  UPDATE public.members
  SET membership_type = _type,
      membership_type_changed_at = CASE
        WHEN membership_type IS DISTINCT FROM _type THEN now()
        ELSE membership_type_changed_at
      END
  WHERE id = _member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_membership_type(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(_start timestamptz, _end timestamptz)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'meetings_total', (
      SELECT count(*) FROM public.one_to_one_meetings
      WHERE created_at >= _start AND created_at < _end
    ),
    'meetings_leaderboard', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT m.full_name AS name, counts.user_id, counts.cnt AS count
        FROM (
          SELECT user_id, count(*) AS cnt FROM (
            SELECT meeting_by_user_id AS user_id FROM public.one_to_one_meetings
            WHERE created_at >= _start AND created_at < _end
            UNION ALL
            SELECT meeting_with_user_id AS user_id FROM public.one_to_one_meetings
            WHERE created_at >= _start AND created_at < _end
          ) both_sides
          GROUP BY user_id
          ORDER BY count(*) DESC
          LIMIT 5
        ) counts
        JOIN public.members m ON m.user_id = counts.user_id
        ORDER BY counts.cnt DESC
      ) t
    ),
    'referrals_total', (
      SELECT count(*) FROM public.leads
      WHERE created_at >= _start AND created_at < _end AND is_direct_business = false
    ),
    'business_generated', (
      SELECT COALESCE(sum(amount), 0) FROM public.business_closures
      WHERE closure_date >= _start AND closure_date < _end
    ),
    'new_paid_members', (
      SELECT count(*) FROM public.members
      WHERE membership_type = 'paid_member'
        AND membership_type_changed_at >= _start AND membership_type_changed_at < _end
    ),
    'total_paid_members', (
      SELECT count(*) FROM public.members
      WHERE membership_type = 'paid_member' AND status = 'active'
    ),
    -- The live signup form (Signup.tsx) inserts new sign-ups directly into
    -- `members` (reviewed later on /admin/applications); the separate
    -- `membership_applications` table is legacy/unused, so it is not the
    -- source here.
    'new_registrations', (
      SELECT count(*) FROM public.members
      WHERE created_at >= _start AND created_at < _end
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(timestamptz, timestamptz) TO authenticated;
