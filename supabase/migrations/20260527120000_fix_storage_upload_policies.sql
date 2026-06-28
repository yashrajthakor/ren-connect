-- Fix profile uploads (profile pictures, company logos, visiting cards).
-- Re-applies storage buckets + RLS policies in case the original migration
-- was never applied to the self-hosted Supabase instance, which currently
-- returns "new row violates row-level security policy" on upload.

INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-pictures', 'profile-pictures', true),
  ('company-logos', 'company-logos', true),
  ('visiting-cards', 'visiting-cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read profile assets" ON storage.objects;
CREATE POLICY "Public read profile assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id IN ('profile-pictures','company-logos','visiting-cards'));

DROP POLICY IF EXISTS "Users upload own profile assets" ON storage.objects;
CREATE POLICY "Users upload own profile assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('profile-pictures','company-logos','visiting-cards')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update own profile assets" ON storage.objects;
CREATE POLICY "Users update own profile assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('profile-pictures','company-logos','visiting-cards')
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id IN ('profile-pictures','company-logos','visiting-cards')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users delete own profile assets" ON storage.objects;
CREATE POLICY "Users delete own profile assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('profile-pictures','company-logos','visiting-cards')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
