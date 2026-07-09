-- Networking Feed: publish flag + community-wide visibility for one_to_one_meetings.
-- Reuses the existing table; no separate feed table is introduced.

ALTER TABLE public.one_to_one_meetings
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_o2om_feed
  ON public.one_to_one_meetings (created_at DESC)
  WHERE is_published = true;

-- Any authenticated member can see published posts (the community feed),
-- in addition to their own logs, logs where they're the counterpart, and admins.
DROP POLICY IF EXISTS "o2om select own or admin" ON public.one_to_one_meetings;
DROP POLICY IF EXISTS "o2om select feed or own or admin" ON public.one_to_one_meetings;
CREATE POLICY "o2om select feed or own or admin" ON public.one_to_one_meetings
  FOR SELECT TO authenticated
  USING (
    is_published = true
    OR meeting_by_user_id = auth.uid()
    OR meeting_with_user_id = auth.uid()
    OR public.is_admin_or_super()
  );

-- Admins can update any row (needed to hide/unpublish inappropriate posts);
-- members continue to manage only their own logs.
DROP POLICY IF EXISTS "o2om update own" ON public.one_to_one_meetings;
DROP POLICY IF EXISTS "o2om update own or admin" ON public.one_to_one_meetings;
CREATE POLICY "o2om update own or admin" ON public.one_to_one_meetings
  FOR UPDATE TO authenticated
  USING (meeting_by_user_id = auth.uid() OR public.is_admin_or_super())
  WITH CHECK (meeting_by_user_id = auth.uid() OR public.is_admin_or_super());
