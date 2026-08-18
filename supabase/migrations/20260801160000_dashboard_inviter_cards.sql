-- Two new admin dashboard leaderboards:
--   * "Highest Visitor Invited By" — who invited the visitors that actually
--     attended meetings in the range (attendance.attendance_type = 'visitor',
--     attributed via members.referred_by_member_id captured at visitor creation).
--   * "Highest Induction Done By" — who referred the members converted to
--     Valuable/Paid Member in the range (members.invited_by_member_id).
--
-- Both leaderboards key on members.id (not user_id like the older boards) —
-- visitors and their referrers may have no auth account at all.
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
    ),
    -- Visitor attendances are attributed to the meeting's own date (not the
    -- check-in timestamp) so backdated entries land in the period the
    -- visitor actually attended.
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
    'inductions_total', (
      SELECT count(*) FROM public.members
      WHERE membership_type = 'paid_member'
        AND invited_by_member_id IS NOT NULL
        AND membership_type_changed_at >= _start AND membership_type_changed_at < _end
    ),
    'top_inductors', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT inv.full_name AS name, counts.inviter_id AS member_id, counts.cnt AS count
        FROM (
          SELECT m.invited_by_member_id AS inviter_id, count(*) AS cnt
          FROM public.members m
          WHERE m.membership_type = 'paid_member'
            AND m.invited_by_member_id IS NOT NULL
            AND m.membership_type_changed_at >= _start AND m.membership_type_changed_at < _end
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
