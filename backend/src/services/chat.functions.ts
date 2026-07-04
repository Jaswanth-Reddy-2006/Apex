import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getUserPermissions } from "../lib/permissions.js";
import { requireAuth } from "../lib/auth-middleware.js";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ project_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await context.prisma.chatConversation.findMany({
      where: { project_id: data.project_id },
      orderBy: [
        { is_pinned: "desc" },
        { last_message_at: "desc" }
      ]
    });
    return rows ?? [];
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      project_id: z.string(),
      organization_id: z.string(),
      title: z.string().trim().max(80).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const row = await context.prisma.chatConversation.create({
      data: {
        project_id: data.project_id,
        organization_id: data.organization_id,
        title: data.title || "New chat",
      }
    });
    return row;
  });

export const getConversationMessages = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ conversation_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await context.prisma.chatMessage.findMany({
      where: { conversation_id: data.conversation_id },
      orderBy: { created_at: "asc" }
    });
    return rows ?? [];
  });

export const renameConversation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({ id: z.string(), title: z.string().trim().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.prisma.chatConversation.update({
      where: { id: data.id },
      data: { title: data.title }
    });
    return { ok: true };
  });

export const togglePinConversation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ id: z.string(), pinned: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.prisma.chatConversation.update({
      where: { id: data.id },
      data: { is_pinned: data.pinned }
    });
    return { ok: true };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.prisma.chatConversation.delete({
      where: { id: data.id }
    });
    return { ok: true };
  });

export const searchConversations = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({ project_id: z.string(), q: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Basic regex search for MongoDB Prisma
    const msgs = await context.prisma.chatMessage.findMany({
      where: {
        project_id: data.project_id,
        user_id: context.userId,
        content: { contains: data.q, mode: 'insensitive' }
      },
      take: 30
    });
    return msgs ?? [];
  });

export const uploadChatFileSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z.object({
      conversation_id: z.string(),
      project_id: z.string(),
      file_name: z.string().min(1).max(200),
      mime_type: z.string().min(1).max(120),
      size_bytes: z.number().int().min(1).max(20 * 1024 * 1024),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // In a real MongoDB/Custom Auth app, use S3, Cloudinary, etc for signed urls.
    // For now, return a dummy success
    return { path: "dummy_path", token: "dummy_token", upload_url: "dummy_url" };
  });

// ================================================================
// User's org context
// ================================================================

export const getMyContext = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    // Simplified since RPC logic is missing in Prisma
    const memberships = await context.prisma.organizationMember.findMany({
      where: { user_id: context.userId }
    });

    const orgs = [];
    for (const m of memberships) {
      const org = await context.prisma.organization.findUnique({ where: { id: m.organization_id }});
      let roleName = null, roleSlug = null;
      if (m.custom_role_id) {
         const r = await context.prisma.role.findUnique({ where: { id: m.custom_role_id }});
         if (r) {
           roleName = r.name;
           roleSlug = r.slug;
         }
      }
      
      orgs.push({
        organization_id: m.organization_id,
        organization_name: org?.name ?? "",
        organization_slug: org?.slug ?? "",
        logo_url: org?.logo_url ?? null,
        base_role: m.role,
        custom_role_slug: roleSlug,
        custom_role_name: roleName,
      });
    }

    // Fetch permissions for each org via Prisma
    const permByOrg: Record<string, string[]> = {};
    for (const o of orgs) {
      permByOrg[o.organization_id] = await getUserPermissions(context.userId, o.organization_id);
    }

    return { user_id: context.userId, organizations: orgs, permissions_by_org: permByOrg };
  });
