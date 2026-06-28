-- Re-apply newsletter bucket and storage RLS policies for self-hosted Supabase.
-- Fixes "new row violates row-level security policy" when admins upload cover images.

INSERT INTO storage.buckets (id, name, public)
VALUES ('newsletter', 'newsletter', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read newsletter assets" ON storage.objects;
CREATE POLICY "Public read newsletter assets"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'newsletter');

DROP POLICY IF EXISTS "Admins upload newsletter assets" ON storage.objects;
CREATE POLICY "Admins upload newsletter assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'newsletter' AND public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins update newsletter assets" ON storage.objects;
CREATE POLICY "Admins update newsletter assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'newsletter' AND public.is_admin_or_super())
WITH CHECK (bucket_id = 'newsletter' AND public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins delete newsletter assets" ON storage.objects;
CREATE POLICY "Admins delete newsletter assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'newsletter' AND public.is_admin_or_super());
