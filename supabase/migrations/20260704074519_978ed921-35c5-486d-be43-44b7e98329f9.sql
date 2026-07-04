
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_conv_select" ON public.chat_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_project_member(auth.uid(), project_id));
CREATE POLICY "chat_conv_insert" ON public.chat_conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_project_member(auth.uid(), project_id));
CREATE POLICY "chat_conv_update" ON public.chat_conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_conv_delete" ON public.chat_conversations FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS chat_conv_project_user_idx
  ON public.chat_conversations (project_id, user_id, last_message_at DESC);
CREATE TRIGGER chat_conv_touch BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  tokens_input INT,
  tokens_output INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_msg_select" ON public.chat_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_project_member(auth.uid(), project_id));
CREATE POLICY "chat_msg_insert" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_project_member(auth.uid(), project_id));
CREATE POLICY "chat_msg_delete" ON public.chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS chat_msg_conv_idx
  ON public.chat_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS chat_msg_search_idx
  ON public.chat_messages USING gin (to_tsvector('english', content));

CREATE TABLE IF NOT EXISTS public.chat_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.chat_uploads TO authenticated;
GRANT ALL ON public.chat_uploads TO service_role;
ALTER TABLE public.chat_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_upl_select" ON public.chat_uploads FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_project_member(auth.uid(), project_id));
CREATE POLICY "chat_upl_insert" ON public.chat_uploads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_project_member(auth.uid(), project_id));
CREATE POLICY "chat_upl_delete" ON public.chat_uploads FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.my_org_permissions(_org_id UUID)
RETURNS TABLE(permission_key TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT p.key
  FROM public.organization_members om
  JOIN public.role_permissions rp ON rp.role_id = om.custom_role_id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE om.user_id = auth.uid()
    AND om.organization_id = _org_id
  UNION
  SELECT p.key FROM public.permissions p
  WHERE public.is_org_admin(auth.uid(), _org_id);
$$;
