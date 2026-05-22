-- Add approval notification type + trigger to notify member when status flips to active
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'profile_approved';
EXCEPTION WHEN others THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.tg_member_notify_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'active'
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
    VALUES (
      NEW.user_id,
      'profile_approved',
      '🎉 Your profile has been approved!',
      'Congratulations! You now have full access to all RBN features including Leads and Ask Network.',
      '/dashboard',
      jsonb_build_object('member_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS member_notify_approval_trigger ON public.members;
CREATE TRIGGER member_notify_approval_trigger
AFTER UPDATE OF status ON public.members
FOR EACH ROW EXECUTE FUNCTION public.tg_member_notify_approval();

-- RPC for current user's member status
CREATE OR REPLACE FUNCTION public.get_my_member_status()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status FROM public.members WHERE user_id = auth.uid() LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_member_status() TO authenticated;
