-- Rename "lead" to "referral" in user-facing notification text.
-- Wording only: types, links, metadata keys and table/column names are unchanged.

BEGIN;

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
    IF NEW.is_direct_business THEN
      INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
      VALUES (
        NEW.giver_id,
        'business_closed'::public.notification_type,
        'Business appreciation received',
        'You received business appreciation from ' || coalesce(v_receiver_name, 'a member')
          || COALESCE(' for ' || NULLIF(NEW.description, ''), '')
          || COALESCE(' (₹' || NEW.closure_amount::text || ')', ''),
        '/dashboard/leads',
        jsonb_build_object('lead_id', NEW.id, 'amount', NEW.closure_amount, 'direct', true)
      );
    ELSE
      INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
      VALUES (
        NEW.receiver_id,
        'lead_received'::public.notification_type,
        'New referral received',
        coalesce(v_giver_name, 'A member') || ' shared a referral: ' || NEW.lead_name,
        '/dashboard/leads',
        jsonb_build_object('lead_id', NEW.id)
      );
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'business_closed' THEN
      INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
      VALUES (
        NEW.giver_id,
        'business_closed'::public.notification_type,
        'Business closed',
        coalesce(v_receiver_name, 'Member') || ' closed business on referral: ' || NEW.lead_name,
        '/dashboard/leads',
        jsonb_build_object('lead_id', NEW.id, 'amount', NEW.closure_amount)
      );
    ELSE
      INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
      VALUES (
        NEW.giver_id,
        'lead_updated'::public.notification_type,
        'Referral status updated',
        'Referral "' || NEW.lead_name || '" is now ' || replace(NEW.status::text, '_', ' '),
        '/dashboard/leads',
        jsonb_build_object('lead_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

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
      'Congratulations! You now have full access to all RBN features including Referrals and Ask Network.',
      '/dashboard',
      jsonb_build_object('member_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;

-- OPTIONAL: also reword notifications that were already sent.
-- Uncomment and run separately if you want old notifications to match.
--
-- BEGIN;
-- UPDATE public.notifications
--   SET title = 'New referral received',
--       body  = replace(body, ' shared a lead: ', ' shared a referral: ')
--   WHERE type = 'lead_received' AND title = 'New lead received';
--
-- UPDATE public.notifications
--   SET body = replace(body, ' closed business on lead: ', ' closed business on referral: ')
--   WHERE type = 'business_closed' AND body LIKE '% closed business on lead: %';
--
-- UPDATE public.notifications
--   SET title = 'Referral status updated',
--       body  = regexp_replace(body, '^Lead "', 'Referral "')
--   WHERE type = 'lead_updated' AND title = 'Lead status updated';
--
-- UPDATE public.notifications
--   SET body = replace(body, 'including Leads and Ask Network', 'including Referrals and Ask Network')
--   WHERE type = 'profile_approved' AND body LIKE '%including Leads and Ask Network%';
-- COMMIT;
