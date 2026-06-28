-- RBN Notice Board / Public Announcements
DO $$ BEGIN
  CREATE TYPE public.notice_category AS ENUM (
    'meeting', 'event', 'announcement', 'reminder', 'alert', 'community_update'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notice_priority AS ENUM ('high', 'medium', 'normal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.notice_board (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category public.notice_category NOT NULL DEFAULT 'announcement',
  priority public.notice_priority NOT NULL DEFAULT 'normal',
  is_pinned boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  publish_date timestamptz NOT NULL DEFAULT now(),
  expiry_date timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notice_board_active ON public.notice_board(is_active, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_notice_board_priority ON public.notice_board(priority, is_pinned DESC);

GRANT SELECT ON public.notice_board TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notice_board TO authenticated;
GRANT ALL ON public.notice_board TO service_role;

ALTER TABLE public.notice_board ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active notices" ON public.notice_board;
CREATE POLICY "Public reads active notices" ON public.notice_board FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND publish_date <= now()
  AND (expiry_date IS NULL OR expiry_date > now())
);

DROP POLICY IF EXISTS "Admins read all notices" ON public.notice_board;
CREATE POLICY "Admins read all notices" ON public.notice_board FOR SELECT
TO authenticated USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins manage notices" ON public.notice_board;
CREATE POLICY "Admins manage notices" ON public.notice_board FOR ALL
TO authenticated
USING (public.is_admin_or_super())
WITH CHECK (public.is_admin_or_super());

CREATE OR REPLACE FUNCTION public.tg_notice_board_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notice_board_updated_trigger ON public.notice_board;
CREATE TRIGGER notice_board_updated_trigger
BEFORE UPDATE ON public.notice_board
FOR EACH ROW EXECUTE FUNCTION public.tg_notice_board_updated();
