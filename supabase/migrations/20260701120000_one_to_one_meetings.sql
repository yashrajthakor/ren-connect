-- 1-to-1 Meeting Log system
CREATE TABLE IF NOT EXISTS public.one_to_one_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_by_categories text[] NOT NULL DEFAULT ARRAY[]::text[],
  meeting_with_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_with_categories text[] NOT NULL DEFAULT ARRAY[]::text[],
  meeting_photo_url text,
  discussion_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_o2om_by ON public.one_to_one_meetings(meeting_by_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_o2om_with ON public.one_to_one_meetings(meeting_with_user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.one_to_one_meetings TO authenticated;
GRANT ALL ON public.one_to_one_meetings TO service_role;

ALTER TABLE public.one_to_one_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "o2om select own or admin" ON public.one_to_one_meetings;
CREATE POLICY "o2om select own or admin" ON public.one_to_one_meetings
  FOR SELECT TO authenticated
  USING (
    meeting_by_user_id = auth.uid()
    OR meeting_with_user_id = auth.uid()
    OR public.is_admin_or_super()
  );

DROP POLICY IF EXISTS "o2om insert own" ON public.one_to_one_meetings;
CREATE POLICY "o2om insert own" ON public.one_to_one_meetings
  FOR INSERT TO authenticated
  WITH CHECK (meeting_by_user_id = auth.uid());

DROP POLICY IF EXISTS "o2om update own" ON public.one_to_one_meetings;
CREATE POLICY "o2om update own" ON public.one_to_one_meetings
  FOR UPDATE TO authenticated
  USING (meeting_by_user_id = auth.uid())
  WITH CHECK (meeting_by_user_id = auth.uid());

DROP POLICY IF EXISTS "o2om delete own or admin" ON public.one_to_one_meetings;
CREATE POLICY "o2om delete own or admin" ON public.one_to_one_meetings
  FOR DELETE TO authenticated
  USING (meeting_by_user_id = auth.uid() OR public.is_admin_or_super());

CREATE OR REPLACE FUNCTION public.tg_o2om_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS tg_o2om_touch ON public.one_to_one_meetings;
CREATE TRIGGER tg_o2om_touch BEFORE UPDATE ON public.one_to_one_meetings
FOR EACH ROW EXECUTE FUNCTION public.tg_o2om_touch();

INSERT INTO storage.buckets (id, name, public) VALUES ('meeting-photos', 'meeting-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read meeting photos" ON storage.objects;
CREATE POLICY "Public read meeting photos"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'meeting-photos');

DROP POLICY IF EXISTS "Users upload own meeting photos" ON storage.objects;
CREATE POLICY "Users upload own meeting photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'meeting-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update own meeting photos" ON storage.objects;
CREATE POLICY "Users update own meeting photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'meeting-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'meeting-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own meeting photos" ON storage.objects;
CREATE POLICY "Users delete own meeting photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'meeting-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.list_all_meetings_for_admin()
RETURNS SETOF public.one_to_one_meetings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.one_to_one_meetings
  WHERE public.is_admin_or_super()
  ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_all_meetings_for_admin() TO authenticated;
