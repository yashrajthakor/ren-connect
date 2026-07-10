-- Optional contact number for sponsors, shown in the dashboard sponsor detail popup.
ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS contact_number TEXT NULL;
