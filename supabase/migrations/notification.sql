-- Step 1: Create the missing ENUM type first
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'lead_received', 'lead_updated', 'business_closed', 'announcement', 'admin_update'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Step 2: Now drop and recreate notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       public.notification_type NOT NULL,
  title      text NOT NULL,
  body       text,
  link       text,
  metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins insert notifications" ON public.notifications;
CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_super());

-- Step 3: mark read functions
CREATE OR REPLACE FUNCTION public.mark_notification_read(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notifications SET read_at = now()
  WHERE id = _id AND user_id = auth.uid() AND read_at IS NULL;
$$;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notifications SET read_at = now()
  WHERE user_id = auth.uid() AND read_at IS NULL;
$$;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- Step 4: broadcast_announcement
CREATE OR REPLACE FUNCTION public.broadcast_announcement(
  _title text, _body text, _target_role text DEFAULT 'all', _link text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ann_id        uuid;
  recipient_ids uuid[];
  norm_target   text;
  v_user_id     uuid;
BEGIN
  IF NOT public.is_admin_or_super() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  norm_target := lower(coalesce(_target_role, 'all'));

  IF norm_target = 'all' THEN
    SELECT array_agg(DISTINCT ur.user_id)
    INTO recipient_ids
    FROM public.user_roles ur;
  ELSE
    SELECT array_agg(DISTINCT ur.user_id)
    INTO recipient_ids
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE lower(r.name) = norm_target;
  END IF;

  recipient_ids := coalesce(recipient_ids, ARRAY[]::uuid[]);

  INSERT INTO public.announcements(created_by, title, body, target_role, recipients_count)
  VALUES (auth.uid(), _title, _body, norm_target, coalesce(array_length(recipient_ids, 1), 0))
  RETURNING id INTO ann_id;

  IF coalesce(array_length(recipient_ids, 1), 0) > 0 THEN
    FOREACH v_user_id IN ARRAY recipient_ids LOOP
      INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
      VALUES (
        v_user_id,
        'announcement'::public.notification_type,
        _title,
        _body,
        _link,
        jsonb_build_object('announcement_id', ann_id, 'target_role', norm_target)
      );
    END LOOP;
  END IF;

  RETURN ann_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.broadcast_announcement(text, text, text, text) TO authenticated;

-- Step 5: Lead notify trigger
CREATE OR REPLACE FUNCTION public.tg_leads_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_giver_name    text;
  v_receiver_name text;
BEGIN
  SELECT full_name INTO v_giver_name
  FROM public.members WHERE user_id = NEW.giver_id LIMIT 1;

  SELECT full_name INTO v_receiver_name
  FROM public.members WHERE user_id = NEW.receiver_id LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
    VALUES (
      NEW.receiver_id,
      'lead_received'::public.notification_type,
      'New lead received',
      coalesce(v_giver_name, 'A member') || ' shared a lead: ' || NEW.lead_name,
      '/dashboard/leads',
      jsonb_build_object('lead_id', NEW.id)
    );
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'business_closed' THEN
      INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
      VALUES (
        NEW.giver_id,
        'business_closed'::public.notification_type,
        'Business closed',
        coalesce(v_receiver_name, 'Member') || ' closed business on lead: ' || NEW.lead_name,
        '/dashboard/leads',
        jsonb_build_object('lead_id', NEW.id, 'amount', NEW.closure_amount)
      );
    ELSE
      INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
      VALUES (
        NEW.giver_id,
        'lead_updated'::public.notification_type,
        'Lead status updated',
        'Lead "' || NEW.lead_name || '" is now ' || replace(NEW.status::text, '_', ' '),
        '/dashboard/leads',
        jsonb_build_object('lead_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_notify_trigger ON public.leads;
CREATE TRIGGER leads_notify_trigger AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.tg_leads_notify();

-- Step 6: Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;