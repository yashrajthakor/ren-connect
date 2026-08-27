-- "Highest Induction Done By" (and "New Paid Members") undercounted under
-- every date filter, including "This Year": both were gated on
-- membership_type_changed_at, an internal bookkeeping timestamp stamped only
-- at the moment membership_type actually flips to 'paid_member'. It goes
-- stale the moment an admin later edits that member's Paid Member details
-- (set_paid_member_details — e.g. correcting/assigning "Invited By" after
-- the fact) because that path updates paid_joining_date/invited_by_member_id
-- but deliberately leaves membership_type_changed_at untouched. The result:
-- a member whose inviter was set after their initial conversion silently
-- drops out of every period filter forever, even though their real,
-- always-required join date (paid_joining_date) falls squarely inside it.
-- Example that surfaced this: 3 members list "Invited by Yashrajsinh Thakor"
-- on /admin/members, all with a paid_joining_date in 2026, yet "This Year"
-- only credited him with 1 induction.
-- Fix: filter top_inductors and new_paid_members by paid_joining_date (the
-- authoritative, always-populated join date) instead, with a fallback chain
-- for any legacy row missing it, so the date filter now reflects reality.
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
    'top_referral_givers', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT m.full_name AS name, counts.giver_id AS user_id, counts.cnt AS count
        FROM (
          SELECT giver_id, count(*) AS cnt FROM public.leads
          WHERE created_at >= _start AND created_at < _end AND is_direct_business = false
          GROUP BY giver_id
          ORDER BY count(*) DESC
          LIMIT 5
        ) counts
        JOIN public.members m ON m.user_id = counts.giver_id
        ORDER BY counts.cnt DESC
      ) t
    ),
    'business_generated', (
      SELECT COALESCE(sum(amount), 0) FROM public.business_closures
      WHERE closure_date >= _start AND closure_date < _end
    ),
    'top_givers', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT m.full_name AS name, sums.giver_id AS user_id, sums.total AS amount
        FROM (
          SELECT giver_id, sum(amount) AS total FROM public.business_closures
          WHERE closure_date >= _start AND closure_date < _end
          GROUP BY giver_id
          ORDER BY sum(amount) DESC
          LIMIT 5
        ) sums
        JOIN public.members m ON m.user_id = sums.giver_id
        ORDER BY sums.total DESC
      ) t
    ),
    -- Was: membership_type_changed_at (see migration header for why that
    -- silently undercounts). Now keyed on the real, always-required join date.
    'new_paid_members', (
      SELECT count(*) FROM public.members
      WHERE membership_type = 'paid_member'
        AND COALESCE(paid_joining_date, membership_type_changed_at::date, created_at::date) >= _start::date
        AND COALESCE(paid_joining_date, membership_type_changed_at::date, created_at::date) < _end::date
    ),
    'total_paid_members', (
      SELECT count(*) FROM public.members
      WHERE membership_type = 'paid_member' AND status = 'active'
    ),
    'new_registrations', (
      SELECT count(*) FROM public.members
      WHERE created_at >= _start AND created_at < _end
    ),
    'visitor_visits_total', (
      SELECT count(*)
      FROM public.attendance a
      JOIN public.meetings mt ON mt.id = a.meeting_id
      WHERE a.attendance_type = 'visitor'
        AND mt.meeting_date >= _start::date AND mt.meeting_date < _end::date
    ),
    'top_visitor_inviters', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT ref.full_name AS name, counts.referrer_id AS member_id, counts.cnt AS count
        FROM (
          SELECT vm.referred_by_member_id AS referrer_id, count(*) AS cnt
          FROM public.attendance a
          JOIN public.meetings mt ON mt.id = a.meeting_id
          JOIN public.members vm ON vm.id = a.member_id
          WHERE a.attendance_type = 'visitor'
            AND vm.referred_by_member_id IS NOT NULL
            AND mt.meeting_date >= _start::date AND mt.meeting_date < _end::date
          GROUP BY vm.referred_by_member_id
          ORDER BY count(*) DESC
          LIMIT 5
        ) counts
        JOIN public.members ref ON ref.id = counts.referrer_id
        ORDER BY counts.cnt DESC
      ) t
    ),
    -- Was: membership_type_changed_at (see migration header). Now keyed on
    -- paid_joining_date so an inviter gets credit for every inductee whose
    -- real join date falls in the selected period, even if their record was
    -- edited (e.g. inviter assigned/corrected) after the initial conversion.
    'inductions_total', (
      SELECT count(*) FROM public.members
      WHERE membership_type = 'paid_member'
        AND invited_by_member_id IS NOT NULL
        AND COALESCE(paid_joining_date, membership_type_changed_at::date, created_at::date) >= _start::date
        AND COALESCE(paid_joining_date, membership_type_changed_at::date, created_at::date) < _end::date
    ),
    'top_inductors', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT inv.full_name AS name, counts.inviter_id AS member_id, counts.cnt AS count
        FROM (
          SELECT m.invited_by_member_id AS inviter_id, count(*) AS cnt
          FROM public.members m
          WHERE m.membership_type = 'paid_member'
            AND m.invited_by_member_id IS NOT NULL
            AND COALESCE(m.paid_joining_date, m.membership_type_changed_at::date, m.created_at::date) >= _start::date
            AND COALESCE(m.paid_joining_date, m.membership_type_changed_at::date, m.created_at::date) < _end::date
          GROUP BY m.invited_by_member_id
          ORDER BY count(*) DESC
          LIMIT 5
        ) counts
        JOIN public.members inv ON inv.id = counts.inviter_id
        ORDER BY counts.cnt DESC
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(timestamptz, timestamptz) TO authenticated;
