-- REN Lead Sharing & Business Tracking System

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_current_user_role() IN ('admin', 'super_admin');
$$;
GRANT EXECUTE ON FUNCTION public.is_admin_or_super() TO authenticated;

DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('pending', 'in_process', 'business_closed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_name text NOT NULL,
  contact_number text NOT NULL,
  description text,
  priority public.lead_priority NOT NULL DEFAULT 'medium',
  status public.lead_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  closure_amount numeric(14, 2),
  closure_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_giver ON public.leads(giver_id);
CREATE INDEX IF NOT EXISTS idx_leads_receiver ON public.leads(receiver_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.lead_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_status public.lead_status,
  to_status public.lead_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_history_lead ON public.lead_status_history(lead_id);
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.business_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  giver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(14, 2) NOT NULL,
  closure_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_closures_giver ON public.business_closures(giver_id);
CREATE INDEX IF NOT EXISTS idx_closures_receiver ON public.business_closures(receiver_id);
ALTER TABLE public.business_closures ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.tg_leads_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;
CREATE TRIGGER leads_set_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.tg_leads_updated_at();

CREATE OR REPLACE FUNCTION public.tg_leads_record_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_status_history(lead_id, changed_by, from_status, to_status, note)
    VALUES (NEW.id, auth.uid(), NULL, NEW.status, 'Lead created');
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lead_status_history(lead_id, changed_by, from_status, to_status, note)
    VALUES (NEW.id, auth.uid(), OLD.status, NEW.status,
      CASE WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
           WHEN NEW.status = 'business_closed' THEN 'Closed at ' || COALESCE(NEW.closure_amount::text, '0')
           ELSE NULL END);
    IF NEW.status = 'business_closed' AND NEW.closure_amount IS NOT NULL THEN
      INSERT INTO public.business_closures(lead_id, giver_id, receiver_id, amount, closure_date)
      VALUES (NEW.id, NEW.giver_id, NEW.receiver_id, NEW.closure_amount, COALESCE(NEW.closure_date, now()))
      ON CONFLICT (lead_id) DO UPDATE SET amount = EXCLUDED.amount, closure_date = EXCLUDED.closure_date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS leads_history_trigger ON public.leads;
CREATE TRIGGER leads_history_trigger AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.tg_leads_record_history();

DROP POLICY IF EXISTS "Participants can view own leads" ON public.leads;
CREATE POLICY "Participants can view own leads" ON public.leads FOR SELECT TO authenticated
USING (giver_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Members can create leads as giver" ON public.leads;
CREATE POLICY "Members can create leads as giver" ON public.leads FOR INSERT TO authenticated
WITH CHECK (giver_id = auth.uid());

DROP POLICY IF EXISTS "Participants can update leads" ON public.leads;
CREATE POLICY "Participants can update leads" ON public.leads FOR UPDATE TO authenticated
USING (giver_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin_or_super())
WITH CHECK (giver_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Giver can delete pending leads" ON public.leads;
CREATE POLICY "Giver can delete pending leads" ON public.leads FOR DELETE TO authenticated
USING ((giver_id = auth.uid() AND status = 'pending') OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Participants can view lead history" ON public.lead_status_history;
CREATE POLICY "Participants can view lead history" ON public.lead_status_history FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_status_history.lead_id
          AND (l.giver_id = auth.uid() OR l.receiver_id = auth.uid()))
  OR public.is_admin_or_super()
);

DROP POLICY IF EXISTS "Participants can view closures" ON public.business_closures;
CREATE POLICY "Participants can view closures" ON public.business_closures FOR SELECT TO authenticated
USING (giver_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin_or_super());

CREATE OR REPLACE FUNCTION public.list_active_members_for_leads()
RETURNS TABLE (id uuid, user_id uuid, name text, business text, category text, city text, avatar_url text, committee_badge text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.user_id, m.name, m.business, m.category, m.city, m.avatar_url, m.committee_badge
  FROM public.members m
  WHERE m.status = 'active' AND m.user_id IS NOT NULL AND m.user_id <> auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.list_active_members_for_leads() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_members_by_user_ids(_user_ids uuid[])
RETURNS TABLE (user_id uuid, name text, business text, avatar_url text, city text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.user_id, m.name, m.business, m.avatar_url, m.city
  FROM public.members m WHERE m.user_id = ANY(_user_ids);
$$;
GRANT EXECUTE ON FUNCTION public.get_members_by_user_ids(uuid[]) TO authenticated;

ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.lead_status_history REPLICA IDENTITY FULL;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.leads';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_status_history';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
