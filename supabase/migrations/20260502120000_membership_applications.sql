-- Membership applications table (public signup, no auth required)
CREATE TABLE IF NOT EXISTS public.membership_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  address text,
  referral_code text,
  business_name text NOT NULL,
  business_category text NOT NULL,
  services text,
  business_address text,
  website text,
  profile_picture_url text,
  company_logo_url text,
  visiting_card_url text,
  linkedin_url text,
  instagram_url text,
  facebook_url text,
  status text NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (public) can submit an application
DROP POLICY IF EXISTS "Anyone can submit application" ON public.membership_applications;
CREATE POLICY "Anyone can submit application"
  ON public.membership_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated (admins via app logic) can read
DROP POLICY IF EXISTS "Authenticated can read applications" ON public.membership_applications;
CREATE POLICY "Authenticated can read applications"
  ON public.membership_applications
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can update applications" ON public.membership_applications;
CREATE POLICY "Authenticated can update applications"
  ON public.membership_applications
  FOR UPDATE
  TO authenticated
  USING (true);

-- Public storage bucket for application uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-uploads', 'application-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone (anon) to upload to this bucket
DROP POLICY IF EXISTS "Public can upload application files" ON storage.objects;
CREATE POLICY "Public can upload application files"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'application-uploads');

DROP POLICY IF EXISTS "Public can read application files" ON storage.objects;
CREATE POLICY "Public can read application files"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'application-uploads');
