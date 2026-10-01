-- Event Photo Gallery feature.
--
-- RBN had no dedicated "Event" concept (News & Stories and Notice Board both
-- have an events-flavored category, but neither has per-item photo galleries
-- or a detail page built for that). This adds a standalone Events model plus
-- a child gallery table that stores ONLY Google Drive URLs/file IDs — the
-- photographer uploads to Drive, the admin pastes selected share links here;
-- no image bytes are ever stored on or proxied through the RBN server.
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  description text,
  event_date date,
  cover_image text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_status_date
  ON public.events(status, event_date DESC NULLS LAST, created_at DESC);

GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads published events" ON public.events;
CREATE POLICY "Public reads published events" ON public.events FOR SELECT
TO anon, authenticated
USING (status = 'published');

DROP POLICY IF EXISTS "Admins read all events" ON public.events;
CREATE POLICY "Admins read all events" ON public.events FOR SELECT
TO authenticated USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Admins manage events" ON public.events FOR ALL
TO authenticated
USING (public.is_admin_or_super())
WITH CHECK (public.is_admin_or_super());

CREATE OR REPLACE FUNCTION public.tg_events_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_updated_trigger ON public.events;
CREATE TRIGGER events_updated_trigger
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.tg_events_updated();

-- Gallery images: one row per selected Drive photo. drive_file_id is the
-- part actually used to render/link the image; drive_url is kept verbatim
-- (never rewritten) so the admin's original link is always recoverable.
CREATE TABLE IF NOT EXISTS public.event_gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  drive_url text NOT NULL,
  drive_file_id text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, drive_file_id)
);

CREATE INDEX IF NOT EXISTS idx_event_gallery_images_event_order
  ON public.event_gallery_images(event_id, sort_order ASC, created_at ASC);

GRANT SELECT ON public.event_gallery_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_gallery_images TO authenticated;
GRANT ALL ON public.event_gallery_images TO service_role;

ALTER TABLE public.event_gallery_images ENABLE ROW LEVEL SECURITY;

-- Public only ever sees photos belonging to a published event — a gallery
-- for a draft/unpublished event stays admin-only even if its id leaks.
DROP POLICY IF EXISTS "Public reads photos of published events" ON public.event_gallery_images;
CREATE POLICY "Public reads photos of published events" ON public.event_gallery_images FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e WHERE e.id = event_gallery_images.event_id AND e.status = 'published'
));

DROP POLICY IF EXISTS "Admins manage event photos" ON public.event_gallery_images;
CREATE POLICY "Admins manage event photos" ON public.event_gallery_images FOR ALL
TO authenticated
USING (public.is_admin_or_super())
WITH CHECK (public.is_admin_or_super());

CREATE OR REPLACE FUNCTION public.tg_event_gallery_images_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_gallery_images_updated_trigger ON public.event_gallery_images;
CREATE TRIGGER event_gallery_images_updated_trigger
BEFORE UPDATE ON public.event_gallery_images
FOR EACH ROW EXECUTE FUNCTION public.tg_event_gallery_images_updated();
