-- Distinguish Internal leads (lead_name/contact_number are the giver's own
-- details, auto-filled from their profile) from External leads (the giver
-- manually enters an outside customer's name/number). Both types always
-- have a real assigned receiver_id — this column only records whose
-- contact details the lead carries, for display and reporting.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_type text NOT NULL DEFAULT 'internal';

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_lead_type_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_lead_type_check CHECK (lead_type IN ('internal', 'external'));
