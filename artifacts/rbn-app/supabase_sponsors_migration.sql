-- ============================================================
-- Sponsor Highlights table
-- Run this in your Supabase SQL editor to enable the feature.
-- If you already ran a previous version, run the GRANT block
-- at the bottom to fix the "permission denied" error.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_name text NOT NULL,
  firm_name text NOT NULL,
  business_category text NOT NULL,
  logo_url text,
  contact_number text NOT NULL,
  website text,
  tagline text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast active-sponsor queries sorted by display order
CREATE INDEX IF NOT EXISTS idx_sponsors_active_order
  ON public.sponsors (is_active, display_order ASC);

-- ── Grants (required for self-hosted Supabase / PostgREST) ──────────────────
-- Without these the authenticated role gets 403 "permission denied" even
-- when RLS policies would otherwise allow the operation.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Public (homepage carousel): read active sponsors only
DROP POLICY IF EXISTS "Public can read active sponsors" ON public.sponsors;
CREATE POLICY "Public can read active sponsors"
  ON public.sponsors FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated users: read ALL sponsors (admin panel shows hidden ones too)
DROP POLICY IF EXISTS "Authenticated can read all sponsors" ON public.sponsors;
CREATE POLICY "Authenticated can read all sponsors"
  ON public.sponsors FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users: full write access (admin-only enforced at app level)
DROP POLICY IF EXISTS "Authenticated can manage sponsors" ON public.sponsors;
CREATE POLICY "Authenticated can manage sponsors"
  ON public.sponsors FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Logo storage bucket ──────────────────────────────────────────────────────
-- Sponsor logos are stored in the existing "company-logos" bucket.
-- Make sure that bucket exists in Storage → Buckets and is set to Public.
-- If you need to create it:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('company-logos', 'company-logos', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;
