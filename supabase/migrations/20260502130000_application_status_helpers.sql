-- Normalize status values and add helpful index
-- Allowed statuses: 'pending', 'under_review', 'active', 'rejected', 'suspended'
-- Existing default was 'pending_review'; migrate to 'under_review'
UPDATE public.membership_applications
SET status = 'under_review'
WHERE status IN ('pending_review', 'pending');

ALTER TABLE public.membership_applications
  ALTER COLUMN status SET DEFAULT 'under_review';

-- Add CHECK constraint
ALTER TABLE public.membership_applications
  DROP CONSTRAINT IF EXISTS membership_applications_status_check;
ALTER TABLE public.membership_applications
  ADD CONSTRAINT membership_applications_status_check
  CHECK (status IN ('pending', 'under_review', 'active', 'rejected', 'suspended'));

-- Track reviewer + timestamp
ALTER TABLE public.membership_applications
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

CREATE INDEX IF NOT EXISTS idx_membership_applications_status
  ON public.membership_applications(status);

CREATE INDEX IF NOT EXISTS idx_membership_applications_email
  ON public.membership_applications(lower(email));

-- Allow public (anon) to lookup their OWN application status by email at login time
-- We restrict columns via a SECURITY DEFINER function to avoid leaking PII.
CREATE OR REPLACE FUNCTION public.get_application_status_by_email(_email text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status
  FROM public.membership_applications
  WHERE lower(email) = lower(_email)
  ORDER BY created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_application_status_by_email(text) TO anon, authenticated;
