-- Allow admin/super_admin to review full application data (members + business profiles)
DROP POLICY IF EXISTS "Admin can read all members" ON public.members;
CREATE POLICY "Admin can read all members"
ON public.members FOR SELECT TO authenticated
USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Admin can update members" ON public.members;
CREATE POLICY "Admin can update members"
ON public.members FOR UPDATE TO authenticated
USING (public.is_admin_or_super())
WITH CHECK (public.is_admin_or_super());

DROP POLICY IF EXISTS "Admin can read all business profiles" ON public.business_profiles;
CREATE POLICY "Admin can read all business profiles"
ON public.business_profiles FOR SELECT TO authenticated
USING (public.is_admin_or_super());
