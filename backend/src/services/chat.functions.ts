import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_conversations")
      .select("id, title, pinned, archived, last_message_at, created_at")
      .eq("project_id", data.project_id)
      .eq("user_id", context.userId)
      .eq("archived", false)
      .order("pinned", { ascending: false })
      .order("last_message_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      project_id: z.string().uuid(),
      organization_id: z.string().uuid(),
      title: z.string().trim().max(80).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("chat_conversations")
      .insert({
        project_id: data.project_id,
        organization_id: data.organization_id,
        user_id: context.userId,
        title: data.title || "New chat",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getConversationMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ conversation_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, attachments, created_at, model")
      .eq("conversation_id", data.conversation_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const renameConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), title: z.string().trim().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_conversations")
      .update({ title: data.title })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const togglePinConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), pinned: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_conversations")
      .update({ pinned: data.pinned })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_conversations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const searchConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ project_id: z.string().uuid(), q: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const q = `%${data.q}%`;
    const { data: msgs, error } = await context.supabase
      .from("chat_messages")
      .select("conversation_id, content, created_at, chat_conversations!inner(id, title, project_id)")
      .ilike("content", q)
      .eq("project_id", data.project_id)
      .eq("user_id", context.userId)
      .limit(30);
    if (error) throw new Error(error.message);
    return msgs ?? [];
  });

export const uploadChatFileSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      conversation_id: z.string().uuid(),
      project_id: z.string().uuid(),
      file_name: z.string().min(1).max(200),
      mime_type: z.string().min(1).max(120),
      size_bytes: z.number().int().min(1).max(20 * 1024 * 1024),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const path = `${context.userId}/${data.conversation_id}/${crypto.randomUUID()}-${data.file_name}`;
    const { data: signed, error } = await context.supabase.storage
      .from("chat-uploads")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Failed to sign");
    await context.supabase.from("chat_uploads").insert({
      conversation_id: data.conversation_id,
      project_id: data.project_id,
      user_id: context.userId,
      storage_path: path,
      file_name: data.file_name,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
    });
    return { path, token: signed.token, upload_url: signed.signedUrl };
  });

// ================================================================
// User's org context (memberships, active role, effective permissions)
// ================================================================

export const getMyContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    let { data: memberships, error } = await context.supabase
      .from("organization_members")
      .select("id, role, custom_role_id, organization_id, organizations:organization_id(id, name, slug, logo_url), roles:custom_role_id(slug, name)")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    // Auto-bootstrap a default organization "Apex" if none exists
    if (!memberships || memberships.length === 0) {
      console.log(`[Auto-Bootstrap] Seeding default organization 'Apex' for user ${context.userId}`);
      const bootstrapRes = await context.supabase.rpc("bootstrap_organization", {
        _name: "Apex",
        _default_project_name: "First Project",
        _description: "My Apex Organization",
        _domain: "",
        _industry: "",
        _employee_count: "",
        _country: "",
        _timezone: "",
        _phone: "",
        _logo_url: "",
      });

      if (!bootstrapRes.error) {
        const reloadRes = await context.supabase
          .from("organization_members")
          .select("id, role, custom_role_id, organization_id, organizations:organization_id(id, name, slug, logo_url), roles:custom_role_id(slug, name)")
          .eq("user_id", context.userId);
        if (!reloadRes.error && reloadRes.data) {
          memberships = reloadRes.data;
        }
      } else {
        console.warn("[Auto-Bootstrap] Failed to seed organization:", bootstrapRes.error);
      }
    }

    const orgs = (memberships ?? []).map((m) => {
      const org = m.organizations as unknown as { id: string; name: string; slug: string; logo_url: string | null } | null;
      const role = m.roles as unknown as { slug: string; name: string } | null;
      return {
        organization_id: m.organization_id,
        organization_name: org?.name ?? "",
        organization_slug: org?.slug ?? "",
        logo_url: org?.logo_url ?? null,
        base_role: m.role as string,
        custom_role_slug: role?.slug ?? null,
        custom_role_name: role?.name ?? null,
      };
    });

    // Fetch permissions for each org via RPC
    const permByOrg: Record<string, string[]> = {};
    for (const o of orgs) {
      const { data: perms } = await context.supabase.rpc("my_org_permissions", {
        _org_id: o.organization_id,
      });
      permByOrg[o.organization_id] = ((perms ?? []) as Array<{ permission_key: string }>).map(
        (p) => p.permission_key,
      );
    }

    return { user_id: context.userId, organizations: orgs, permissions_by_org: permByOrg };
  });
