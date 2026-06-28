-- Notify Admins and Super Admins when a new membership application is submitted

DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_application';
EXCEPTION WHEN others THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.tg_application_notify_admins()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_ids uuid[];
  body_text text;
BEGIN
  SELECT array_agg(DISTINCT ur.user_id) INTO admin_ids
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE lower(r.name) IN ('admin', 'super_admin');

  IF coalesce(array_length(admin_ids, 1), 0) = 0 THEN
    RETURN NEW;
  END IF;

  body_text := 'Name: ' || NEW.full_name || E'\nBusiness Category: ' || NEW.business_category;

  INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
  SELECT uid, 'new_application',
    '🔔 New Member Application Received',
    body_text,
    '/admin/applications',
    jsonb_build_object(
      'application_id', NEW.id,
      'full_name', NEW.full_name,
      'business_name', NEW.business_name,
      'business_category', NEW.business_category,
      'email', NEW.email,
      'phone', NEW.phone
    )
  FROM unnest(admin_ids) AS uid;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS application_notify_admins_trigger ON public.membership_applications;
CREATE TRIGGER application_notify_admins_trigger
AFTER INSERT ON public.membership_applications
FOR EACH ROW EXECUTE FUNCTION public.tg_application_notify_admins();
