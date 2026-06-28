-- Rename referral_code → referral_person (business_profiles + legacy membership_applications)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE public.business_profiles RENAME COLUMN referral_code TO referral_person;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_profiles' AND column_name = 'referral_person'
  ) THEN
    ALTER TABLE public.business_profiles ADD COLUMN referral_person text;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'membership_applications' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE public.membership_applications RENAME COLUMN referral_code TO referral_person;
  END IF;
END $$;

-- Allow admin/super_admin to update business profiles (e.g. referral_person mapping)
DROP POLICY IF EXISTS "Admin can update business profiles" ON public.business_profiles;
CREATE POLICY "Admin can update business profiles"
ON public.business_profiles FOR UPDATE TO authenticated
USING (public.is_admin_or_super())
WITH CHECK (public.is_admin_or_super());
