-- Role management helpers for super_admin

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND lower(r.name) = 'super_admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DROP POLICY IF EXISTS "Super admin can read all user_roles" ON public.user_roles;
CREATE POLICY "Super admin can read all user_roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can insert user_roles" ON public.user_roles;
CREATE POLICY "Super admin can insert user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can delete user_roles" ON public.user_roles;
CREATE POLICY "Super admin can delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.is_super_admin());

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admin can read all members" ON public.members;
CREATE POLICY "Super admin can read all members"
ON public.members FOR SELECT TO authenticated
USING (public.is_super_admin());

CREATE OR REPLACE FUNCTION public.list_members_with_roles()
RETURNS TABLE (
  member_id uuid, user_id uuid, full_name text, email text,
  chapter_id uuid, chapter_name text, status text,
  role_id uuid, role_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.user_id, m.full_name, m.email, m.chapter_id,
         c.name AS chapter_name, m.status, r.id AS role_id, r.name AS role_name
  FROM public.members m
  LEFT JOIN public.user_roles ur ON ur.user_id = m.user_id
  LEFT JOIN public.roles r ON r.id = ur.role_id
  LEFT JOIN public.chapters c ON c.id = m.chapter_id
  WHERE public.is_super_admin() AND m.status = 'active'
  ORDER BY m.full_name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_members_with_roles() TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _role_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role_id uuid;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super_admin can assign roles';
  END IF;
  SELECT id INTO v_role_id FROM public.roles WHERE lower(name) = lower(_role_name) LIMIT 1;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Unknown role: %', _role_name;
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role_id) VALUES (_user_id, v_role_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, text) TO authenticated;
