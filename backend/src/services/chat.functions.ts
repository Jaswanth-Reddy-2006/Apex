import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware.js";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ project_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await context.prisma.chatConversation.findMany({
      where: { project_id: data.project_id, user_id: context.userId },
      orderBy: [
        { pinned: "desc" },
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
        user_id: context.userId,
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
      data: { pinned: data.pinned }
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

    function getStaticPermissions(role: string): string[] {
      const r = role.toLowerCase();
      if (r === "owner" || r === "admin") {
        return [
          "Chat.Access",
          "Project.View",
          "People.View",
          "Integrations.Connect",
          "Analytics.View",
          "Billing.View",
          "Roles.View",
          "Roles.Manage",
          "Settings.View",
          "Audit.View",
        ];
      } else if (r === "manager" || r === "project-manager") {
        return [
          "Chat.Access",
          "Project.View",
          "People.View",
          "Integrations.Connect",
          "Analytics.View",
          "Roles.View",
          "Roles.Manage",
        ];
      } else if (r === "finance") {
        return [
          "Chat.Access",
          "Project.View",
          "Analytics.View",
          "Billing.View",
          "Integrations.Connect",
        ];
      } else if (["developer", "designer", "qa", "tester", "devops"].includes(r)) {
        return [
          "Chat.Access",
          "Project.View",
          "Analytics.View",
          "Integrations.Connect",
        ];
      }
      return ["Chat.Access", "Project.View", "Integrations.Connect", "Analytics.View"];
    }

    const permByOrg: Record<string, string[]> = {};
    for (const o of orgs) {
       let perms: string[] = ["Chat.Access", "Project.View"];
       
       const m = memberships.find(member => member.organization_id === o.organization_id);
       
       let roleId = null;
       if (m?.custom_role_id) {
         roleId = m.custom_role_id;
       } else if (m?.role) {
         const sysRole = await context.prisma.role.findFirst({
           where: {
             is_system: true,
             name: m.role.toLowerCase()
           }
         });
         if (sysRole) {
           roleId = sysRole.id;
         }
       }

       if (roleId) {
         const rolePerms = await context.prisma.rolePermission.findMany({
           where: { role_id: roleId }
         });
         const permIds = rolePerms.map((rp: any) => rp.permission_id);
         const dbPerms = await context.prisma.permission.findMany({
           where: { id: { in: permIds } }
         });
         const keys = dbPerms.map((p: any) => p.key);
         if (keys.length > 0) {
           perms = keys;
         } else {
           perms = getStaticPermissions(m?.role || "viewer");
         }
       } else {
         perms = getStaticPermissions(m?.role || "viewer");
       }

       // Map granular database CRUD permission keys to UI views
       const uiKeys: string[] = [];
       if (perms.includes("Chat.Read") || perms.includes("Chat.Create") || perms.includes("Chat.Access")) uiKeys.push("Chat.Access");
       if (perms.includes("Project.Read") || perms.includes("Project.View")) uiKeys.push("Project.View");
       if (perms.includes("Project.Create")) uiKeys.push("Project.Create");
       if (perms.includes("People.Read") || perms.includes("People.View")) uiKeys.push("People.View");
       if (perms.includes("People.Create") || perms.includes("People.Update") || perms.includes("People.Invite") || perms.includes("People.Manage")) uiKeys.push("People.Invite", "People.Manage");
       if (perms.includes("Roles.Read") || perms.includes("Roles.View")) uiKeys.push("Roles.View");
       if (perms.includes("Roles.Create") || perms.includes("Roles.Update") || perms.includes("Roles.Delete") || perms.includes("Roles.Manage")) uiKeys.push("Roles.Manage");
       if (perms.includes("Integrations.Create") || perms.includes("Integrations.Read") || perms.includes("Integrations.Connect")) uiKeys.push("Integrations.Connect");
       if (perms.includes("Analytics.Read") || perms.includes("Analytics.View")) uiKeys.push("Analytics.View");
       if (perms.includes("Billing.Read") || perms.includes("Billing.View")) uiKeys.push("Billing.View");
       if (perms.includes("Audit.Read") || perms.includes("Audit.View")) uiKeys.push("Audit.View");

       perms = Array.from(new Set([...perms, ...uiKeys]));

       if (o.base_role.toLowerCase() === "owner" || o.base_role.toLowerCase() === "admin") {
         const allDbPerms = await context.prisma.permission.findMany();
         perms = Array.from(new Set([
           ...perms, 
           ...allDbPerms.map((p: any) => p.key), 
           "Chat.Access",
           "Project.View",
           "Project.Create",
           "People.View",
           "People.Invite",
           "People.Manage",
           "Roles.View",
           "Roles.Manage",
           "Integrations.Connect",
           "Analytics.View",
           "Billing.View",
           "Audit.View",
           "Settings.View"
         ]));
       }

       permByOrg[o.organization_id] = perms;
    }

    return { user_id: context.userId, organizations: orgs, permissions_by_org: permByOrg };
  });
