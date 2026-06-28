-- Step 1: Add notification type (safe, skips if already exists)
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_application';
EXCEPTION WHEN others THEN NULL; END $$;

-- Step 2: Create the trigger function on members table
CREATE OR REPLACE FUNCTION public.tg_application_notify_admins()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_ids uuid[];
  body_text text;
BEGIN
  -- Only fire for new applications (under_review status)
  IF NEW.status <> 'under_review' THEN
    RETURN NEW;
  END IF;

  -- Gather all admin and super_admin user IDs
  SELECT array_agg(DISTINCT ur.user_id) INTO admin_ids
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE lower(r.name) IN ('admin', 'super_admin');

  IF coalesce(array_length(admin_ids, 1), 0) = 0 THEN
    RETURN NEW;
  END IF;

  body_text := 'Name: ' || NEW.full_name
            || E'\nEmail: ' || coalesce(NEW.email, 'N/A')
            || E'\nPhone: ' || coalesce(NEW.phone, 'N/A');

  INSERT INTO public.notifications(user_id, type, title, body, link, metadata)
  SELECT
    uid,
    'new_application',
    '🔔 New Member Application Received',
    body_text,
    '/admin/applications',
    jsonb_build_object(
      'member_id',  NEW.id,
      'user_id',    NEW.user_id,
      'full_name',  NEW.full_name,
      'email',      NEW.email,
      'phone',      NEW.phone,
      'city_id',    NEW.city_id,
      'chapter_id', NEW.chapter_id
    )
  FROM unnest(admin_ids) AS uid;

  RETURN NEW;
END;
$$;

-- Step 3: Attach trigger to members table (INSERT only)
DROP TRIGGER IF EXISTS application_notify_admins_trigger ON public.members;
CREATE TRIGGER application_notify_admins_trigger
AFTER INSERT ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.tg_application_notify_admins();