-- REN "Ask Network" — Community Business Requirement Board

DO $$ BEGIN
  CREATE TYPE public.ask_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ask_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.asks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text,
  city text,
  priority public.ask_priority NOT NULL DEFAULT 'medium',
  contact_details text,
  status public.ask_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_asks_user ON public.asks(user_id);
CREATE INDEX IF NOT EXISTS idx_asks_status ON public.asks(status);
CREATE INDEX IF NOT EXISTS idx_asks_created ON public.asks(created_at DESC);
ALTER TABLE public.asks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ask_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ask_id uuid NOT NULL REFERENCES public.asks(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_status public.ask_status,
  to_status public.ask_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ask_history_ask ON public.ask_status_history(ask_id);
ALTER TABLE public.ask_status_history ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_asks_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status = 'resolved' AND (OLD.status IS DISTINCT FROM 'resolved') THEN
    NEW.resolved_at := now();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS asks_set_updated_at ON public.asks;
CREATE TRIGGER asks_set_updated_at BEFORE UPDATE ON public.asks
FOR EACH ROW EXECUTE FUNCTION public.tg_asks_updated_at();

-- history trigger
CREATE OR REPLACE FUNCTION public.tg_asks_record_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ask_status_history(ask_id, changed_by, from_status, to_status, note)
    VALUES (NEW.id, auth.uid(), NULL, NEW.status, 'Ask created');
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.ask_status_history(ask_id, changed_by, from_status, to_status, note)
    VALUES (NEW.id, auth.uid(), OLD.status, NEW.status, NULL);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS asks_history_trigger ON public.asks;
CREATE TRIGGER asks_history_trigger AFTER INSERT OR UPDATE ON public.asks
FOR EACH ROW EXECUTE FUNCTION public.tg_asks_record_history();

-- Add ask notification types to existing enum
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_ask';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'ask_updated';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'ask_resolved';
EXCEPTION WHEN others THEN NULL; END $$;

-- RLS policies
DROP POLICY IF EXISTS "Authenticated can view asks" ON public.asks;
CREATE POLICY "Authenticated can view asks" ON public.asks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members create own asks" ON public.asks;
CREATE POLICY "Members create own asks" ON public.asks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owner or admin update asks" ON public.asks;
CREATE POLICY "Owner or admin update asks" ON public.asks FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_super())
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Owner or admin delete asks" ON public.asks;
CREATE POLICY "Owner or admin delete asks" ON public.asks FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Authenticated view ask history" ON public.ask_status_history;
CREATE POLICY "Authenticated view ask history" ON public.ask_status_history FOR SELECT TO authenticated USING (true);

-- Realtime
ALTER TABLE public.asks REPLICA IDENTITY FULL;
ALTER TABLE public.ask_status_history REPLICA IDENTITY FULL;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.asks';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ask_status_history';
EXCEPTION WHEN others THEN NULL; END $$;

-- Notify members on new ask + notify creator on status change
CREATE OR REPLACE FUNCTION public.tg_asks_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  asker_name text;
BEGIN
  SELECT name INTO asker_name FROM public.members WHERE user_id = NEW.user_id LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    -- notify all active members (except creator)
    INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
    SELECT m.user_id, 'new_ask',
      '🆕 New Ask posted',
      coalesce(asker_name, 'A member') || ': ' || NEW.title,
      '/dashboard/asks',
      jsonb_build_object('ask_id', NEW.id, 'category', NEW.category, 'city', NEW.city)
    FROM public.members m
    WHERE m.status = 'active' AND m.user_id IS NOT NULL AND m.user_id <> NEW.user_id;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'resolved' THEN
      INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
      VALUES (NEW.user_id, 'ask_resolved',
        'Ask marked as resolved',
        'Your ask "' || NEW.title || '" was marked resolved.',
        '/dashboard/asks',
        jsonb_build_object('ask_id', NEW.id));
    ELSE
      INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
      VALUES (NEW.user_id, 'ask_updated',
        'Ask status updated',
        'Your ask "' || NEW.title || '" is now ' || replace(NEW.status::text, '_', ' '),
        '/dashboard/asks',
        jsonb_build_object('ask_id', NEW.id, 'status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS asks_notify_trigger ON public.asks;
CREATE TRIGGER asks_notify_trigger AFTER INSERT OR UPDATE ON public.asks
FOR EACH ROW EXECUTE FUNCTION public.tg_asks_notify();
