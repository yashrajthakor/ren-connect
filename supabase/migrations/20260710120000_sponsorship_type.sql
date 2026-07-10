-- Add sponsorship category to sponsors (e.g. Title Sponsor, Gold Sponsor, Diary Sponsor).
-- Default backfills existing rows so the column can be NOT NULL.
ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS sponsorship_type TEXT NOT NULL DEFAULT 'Event Sponsor';
