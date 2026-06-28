-- Direct business / thank member flow on leads

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS is_direct_business boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thank_you_note text NULL;

CREATE INDEX IF NOT EXISTS idx_leads_is_direct_business
  ON public.leads(is_direct_business) WHERE is_direct_business = true;

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
        'New lead received',
        coalesce(v_giver_name, 'A member') || ' shared a lead: ' || NEW.lead_name,
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

CREATE OR REPLACE FUNCTION public.create_direct_business_thanks(
  _giver_id uuid,
  _amount numeric,
  _description text,
  _thank_you_note text
)
RETURNS public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_lead public.leads;
  v_valid_member boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _giver_id IS NULL OR _giver_id = v_uid THEN
    RAISE EXCEPTION 'Select a different member to appreciate';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Business amount must be greater than zero';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = _giver_id AND status = 'active'
  ) INTO v_valid_member;
  IF NOT v_valid_member THEN
    RAISE EXCEPTION 'Selected member is not active';
  END IF;

  INSERT INTO public.leads(
    giver_id, receiver_id, lead_name, contact_number, description,
    priority, status, closure_amount, closure_date,
    is_direct_business, thank_you_note
  ) VALUES (
    _giver_id, v_uid,
    'Direct Business Appreciation',
    '',
    NULLIF(btrim(_description), ''),
    'medium'::public.lead_priority,
    'business_closed'::public.lead_status,
    _amount,
    now(),
    true,
    NULLIF(btrim(_thank_you_note), '')
  )
  RETURNING * INTO v_lead;

  INSERT INTO public.business_closures(lead_id, giver_id, receiver_id, amount, closure_date)
  VALUES (v_lead.id, v_lead.giver_id, v_lead.receiver_id, v_lead.closure_amount, v_lead.closure_date)
  ON CONFLICT (lead_id) DO NOTHING;

  RETURN v_lead;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_direct_business_thanks(uuid, numeric, text, text) TO authenticated;
