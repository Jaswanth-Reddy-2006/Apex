
-- =========================================================
-- APEX Phase 1 Module: Roles, Permissions, Project Members
-- =========================================================

-- ---------- Extend organizations with company profile ----------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS employee_count TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ---------- Permissions catalog ----------
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permissions are readable by all authenticated"
  ON public.permissions FOR SELECT TO authenticated USING (true);

INSERT INTO public.permissions (key, category, description) VALUES
  ('People.Create', 'People', 'Invite and create members'),
  ('People.Update', 'People', 'Edit members and change their role'),
  ('People.Delete', 'People', 'Remove members from the organization'),
  ('People.View', 'People', 'View organization members'),
  ('Project.Create', 'Project', 'Create new projects'),
  ('Project.Update', 'Project', 'Edit project details'),
  ('Project.Delete', 'Project', 'Delete projects'),
  ('Project.View', 'Project', 'View projects'),
  ('Task.Create', 'Task', 'Create tasks'),
  ('Task.Update', 'Task', 'Update tasks'),
  ('Task.Delete', 'Task', 'Delete tasks'),
  ('Task.View', 'Task', 'View tasks'),
  ('Integrations.Connect', 'Integrations', 'Connect third-party integrations'),
  ('Integrations.Disconnect', 'Integrations', 'Disconnect integrations'),
  ('Billing.View', 'Billing', 'View billing and invoices'),
  ('Billing.Update', 'Billing', 'Manage billing plan and payment methods'),
  ('Organization.Settings', 'Organization', 'Manage organization settings'),
  ('Analytics.View', 'Analytics', 'View analytics dashboards'),
  ('Deployments.Execute', 'Deployments', 'Trigger and manage deployments'),
  ('Knowledge.View', 'Knowledge', 'View project knowledge base'),
  ('Knowledge.Edit', 'Knowledge', 'Edit project knowledge base'),
  ('Chat.Access', 'Chat', 'Access project AI chat'),
  ('AI.Execute', 'AI', 'Run AI actions and workflows'),
  ('AuditLog.View', 'Audit', 'View organization audit logs'),
  ('Role.Manage', 'Role', 'Create and edit custom roles')
ON CONFLICT (key) DO NOTHING;

-- ---------- Roles ----------
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_roles_updated
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Org members can view roles"
  ON public.roles FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins manage roles"
  ON public.roles FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- ---------- Role ↔ Permissions ----------
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

GRANT SELECT, INSERT, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view role permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.id = role_permissions.role_id
      AND public.is_org_member(auth.uid(), r.organization_id)
  ));

CREATE POLICY "Admins manage role permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.id = role_permissions.role_id
      AND public.is_org_admin(auth.uid(), r.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.id = role_permissions.role_id
      AND public.is_org_admin(auth.uid(), r.organization_id)
  ));

-- ---------- Add custom_role_id to organization_members ----------
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- ---------- Project members (per-project isolation) ----------
CREATE TYPE public.project_member_role AS ENUM (
  'manager', 'developer', 'designer', 'qa', 'devops', 'viewer'
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.project_member_role NOT NULL DEFAULT 'developer',
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_project_members_updated
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Security-definer helper (avoid recursion)
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id AND project_id = _project_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = _project_id
      AND om.user_id = _user_id
      AND om.role IN ('owner', 'admin')
  );
$$;

CREATE POLICY "Project members visible to org members"
  ON public.project_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
      AND public.is_org_member(auth.uid(), p.organization_id)
  ));

CREATE POLICY "Org admins manage project members"
  ON public.project_members FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
      AND public.is_org_admin(auth.uid(), p.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
      AND public.is_org_admin(auth.uid(), p.organization_id)
  ));

-- ---------- Permission check helper ----------
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _org_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- Owners/admins always allowed
  SELECT
    public.is_org_admin(_user_id, _org_id)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      JOIN public.role_permissions rp ON rp.role_id = om.custom_role_id
      JOIN public.permissions p ON p.id = rp.permission_id
      WHERE om.user_id = _user_id
        AND om.organization_id = _org_id
        AND p.key = _permission_key
    );
$$;

-- ---------- Seed default roles for an organization ----------
CREATE OR REPLACE FUNCTION public.seed_default_roles(_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  role_id UUID;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Organization Owner', 'owner', 'Full control over the organization', ARRAY[]::TEXT[]),
      ('Organization Admin', 'admin', 'Administer members, projects, and settings', ARRAY[]::TEXT[]),
      ('Project Manager', 'project-manager', 'Manage projects, members and tasks',
        ARRAY['Project.Create','Project.Update','Project.View','Task.Create','Task.Update','Task.Delete','Task.View','People.View','Analytics.View','Chat.Access','Knowledge.View','Knowledge.Edit']),
      ('Developer', 'developer', 'Access repositories, knowledge, and AI chat',
        ARRAY['Project.View','Task.View','Task.Update','Knowledge.View','Chat.Access','AI.Execute','Deployments.Execute']),
      ('Tester', 'tester', 'Access QA views, bug logs, deployments',
        ARRAY['Project.View','Task.View','Task.Update','Deployments.Execute','Knowledge.View','Chat.Access']),
      ('DevOps', 'devops', 'Run deployments and manage integrations',
        ARRAY['Project.View','Deployments.Execute','Integrations.Connect','Integrations.Disconnect','Knowledge.View','Chat.Access']),
      ('Designer', 'designer', 'Access design assets and project chat',
        ARRAY['Project.View','Task.View','Knowledge.View','Chat.Access']),
      ('Finance', 'finance', 'View invoices and billing',
        ARRAY['Billing.View','Billing.Update','Analytics.View']),
      ('HR', 'hr', 'Manage people and view analytics',
        ARRAY['People.Create','People.Update','People.View','Analytics.View']),
      ('Viewer', 'viewer', 'Read-only access to projects',
        ARRAY['Project.View','Task.View','Knowledge.View']),
      ('Support', 'support', 'Support access to projects and chat',
        ARRAY['Project.View','Task.View','Knowledge.View','Chat.Access'])
    ) AS t(name, slug, description, perms)
  LOOP
    INSERT INTO public.roles (organization_id, name, slug, description, is_system)
    VALUES (_org_id, r.name, r.slug, r.description, true)
    ON CONFLICT (organization_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO role_id;

    IF array_length(r.perms, 1) IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, permission_id)
      SELECT role_id, p.id
      FROM public.permissions p
      WHERE p.key = ANY(r.perms)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to auto-seed roles on org create
CREATE OR REPLACE FUNCTION public.on_organization_created_seed_roles()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.seed_default_roles(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_organization_created_seed_roles ON public.organizations;
CREATE TRIGGER on_organization_created_seed_roles
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.on_organization_created_seed_roles();

-- Backfill for existing organizations
DO $$
DECLARE o RECORD;
BEGIN
  FOR o IN SELECT id FROM public.organizations LOOP
    PERFORM public.seed_default_roles(o.id);
  END LOOP;
END $$;

-- ---------- Atomic bootstrap: org + workspace + project ----------
CREATE OR REPLACE FUNCTION public.bootstrap_organization(
  _name TEXT,
  _description TEXT,
  _domain TEXT,
  _industry TEXT,
  _employee_count TEXT,
  _country TEXT,
  _timezone TEXT,
  _phone TEXT,
  _logo_url TEXT,
  _default_project_name TEXT
)
RETURNS TABLE (organization_id UUID, workspace_id UUID, project_id UUID)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  new_org_id UUID;
  new_ws_id UUID;
  new_proj_id UUID;
  org_slug TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  org_slug := lower(regexp_replace(_name, '[^a-zA-Z0-9]+', '-', 'g'));
  org_slug := trim(both '-' from org_slug);
  org_slug := left(org_slug, 40) || '-' || substr(md5(random()::text), 1, 6);

  INSERT INTO public.organizations
    (name, slug, description, logo_url, domain, industry, employee_count, country, timezone, phone, owner_id)
  VALUES
    (_name, org_slug, NULLIF(_description, ''), NULLIF(_logo_url, ''), NULLIF(_domain, ''),
     NULLIF(_industry, ''), NULLIF(_employee_count, ''), NULLIF(_country, ''),
     NULLIF(_timezone, ''), NULLIF(_phone, ''), uid)
  RETURNING id INTO new_org_id;

  INSERT INTO public.workspaces (organization_id, name, slug, description, created_by)
  VALUES (new_org_id, 'Default Workspace', 'default', 'Default workspace', uid)
  RETURNING id INTO new_ws_id;

  INSERT INTO public.projects (organization_id, workspace_id, name, slug, description, created_by)
  VALUES (new_org_id, new_ws_id, COALESCE(NULLIF(_default_project_name, ''), 'First Project'),
          'first-project', 'Your first project', uid)
  RETURNING id INTO new_proj_id;

  INSERT INTO public.project_members (project_id, user_id, role, added_by)
  VALUES (new_proj_id, uid, 'manager', uid)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.audit_logs (organization_id, actor_id, action, resource, metadata)
  VALUES (new_org_id, uid, 'organization.bootstrap', 'organization',
          jsonb_build_object('workspace_id', new_ws_id, 'project_id', new_proj_id));

  organization_id := new_org_id;
  workspace_id := new_ws_id;
  project_id := new_proj_id;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_organization(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

-- ---------- Accept invitation ----------
CREATE OR REPLACE FUNCTION public.accept_invitation(_token TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  inv RECORD;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO inv FROM public.invitations
  WHERE token = _token AND status = 'pending' AND expires_at > now()
  LIMIT 1;

  IF inv IS NULL THEN
    RAISE EXCEPTION 'invitation not found, revoked, or expired';
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (inv.organization_id, uid, inv.role)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.invitations SET status = 'accepted', updated_at = now() WHERE id = inv.id;

  INSERT INTO public.audit_logs (organization_id, actor_id, action, resource, metadata)
  VALUES (inv.organization_id, uid, 'invitation.accepted', 'invitation',
          jsonb_build_object('invitation_id', inv.id));

  RETURN inv.organization_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;

-- ---------- Public invitation lookup (by token, no auth needed) ----------
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token TEXT)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  email TEXT,
  role public.member_role,
  status public.invitation_status,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.organization_id, o.name, i.email, i.role, i.status, i.expires_at
  FROM public.invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  WHERE i.token = _token;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO authenticated, anon;
