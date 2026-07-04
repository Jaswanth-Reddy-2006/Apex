import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware.js";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);

// ================================================================
// Organizations
// ================================================================

export const listMyOrganizations = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const memberships = await context.prisma.organizationMember.findMany({
      where: { user_id: context.userId }
    });
    const orgIds = memberships.map(m => m.organization_id);
    const data = await context.prisma.organization.findMany({
      where: { id: { in: orgIds } },
      orderBy: { created_at: "desc" },
    });
    return data ?? [];
  });

export const createOrganization = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        description: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const org = await context.prisma.organization.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        owner_id: context.userId,
      }
    });
    return org;
  });

export const bootstrapOrganization = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        description: z.string().trim().max(500).optional().default(""),
        domain: z.string().trim().max(120).optional().default(""),
        industry: z.string().trim().max(80).optional().default(""),
        employee_count: z.string().trim().max(40).optional().default(""),
        country: z.string().trim().max(80).optional().default(""),
        timezone: z.string().trim().max(80).optional().default(""),
        phone: z.string().trim().max(40).optional().default(""),
        logo_url: z.string().trim().url().max(500).optional().or(z.literal("")).default(""),
        default_project_name: z.string().trim().max(80).optional().default("First Project"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Custom Prisma transaction to replace the SQL RPC bootstrap_organization
    const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 6)}`;
    
    const result = await context.prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug,
          description: data.description ?? null,
          domain: data.domain ?? null,
          industry: data.industry ?? null,
          employee_count: data.employee_count ?? null,
          country: data.country ?? null,
          timezone: data.timezone ?? null,
          phone: data.phone ?? null,
          logo_url: data.logo_url ?? null,
          owner_id: context.userId,
        }
      });
      
      const workspace = await tx.workspace.create({
        data: {
          organization_id: org.id,
          name: "Default Workspace",
          slug: "default",
          description: "Default workspace",
        }
      });
      
      const project = await tx.project.create({
        data: {
          organization_id: org.id,
          workspace_id: workspace.id,
          name: data.default_project_name ?? "First Project",
          slug: "first-project",
          description: "Your first project",
          status: "active",
          created_by: context.userId,
        }
      });
      
      await tx.organizationMember.create({
        data: {
          organization_id: org.id,
          user_id: context.userId,
          role: "owner",
          status: "active",
        }
      });

      await tx.projectMember.create({
        data: {
          project_id: project.id,
          user_id: context.userId,
          role: "manager",
        }
      });
      
      return { organization_id: org.id, workspace_id: workspace.id, project_id: project.id };
    });
    
    return result;
  });

// ================================================================
// Dashboard
// ================================================================

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const memberships = await context.prisma.organizationMember.findMany({
      where: { user_id: context.userId }
    });
    const orgIds = memberships.map(m => m.organization_id);
    
    const orgs = orgIds.length;
    const projects = await context.prisma.project.count({ where: { organization_id: { in: orgIds } } });
    const members = await context.prisma.organizationMember.count({ where: { organization_id: { in: orgIds } } });
    const integrations = await context.prisma.integrationConnection.count({
      where: { organization_id: { in: orgIds }, status: "connected" }
    });
    return {
      organizations: orgs,
      projects: projects,
      members: members,
      integrations: integrations,
    };
  });

export const listRecentActivity = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const data = await context.prisma.activityLog.findMany({
      where: { user_id: context.userId },
      orderBy: { created_at: "desc" },
      take: 20
    });
    return data ?? [];
  });

// ================================================================
// Projects
// ================================================================

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const memberships = await context.prisma.organizationMember.findMany({
      where: { user_id: context.userId }
    });
    const orgIds = memberships.map(m => m.organization_id);
    const data = await context.prisma.project.findMany({
      where: { organization_id: { in: orgIds } },
      orderBy: { created_at: "desc" },
    });
    return data ?? [];
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        organization_id: z.string(),
        name: z.string().trim().min(2).max(80),
        description: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const row = await context.prisma.project.create({
      data: {
        organization_id: data.organization_id,
        name: data.name,
        slug: slugify(data.name),
        description: data.description ?? null,
        status: "active",
        created_by: context.userId,
      }
    });
    return row;
  });

// ================================================================
// Workspaces
// ================================================================

export const listWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const memberships = await context.prisma.organizationMember.findMany({
      where: { user_id: context.userId }
    });
    const orgIds = memberships.map(m => m.organization_id);
    const data = await context.prisma.workspace.findMany({
      where: { organization_id: { in: orgIds } },
      orderBy: { created_at: "desc" }
    });
    return data ?? [];
  });

// ================================================================
// Members
// ================================================================

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const memberships = await context.prisma.organizationMember.findMany({
      where: { user_id: context.userId }
    });
    const orgIds = memberships.map(m => m.organization_id);
    const data = await context.prisma.organizationMember.findMany({
      where: { organization_id: { in: orgIds } },
      orderBy: { created_at: "desc" }
    });
    return data ?? [];
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        member_id: z.string(),
        role: z.enum([
          "owner",
          "admin",
          "manager",
          "developer",
          "designer",
          "qa",
          "devops",
          "finance",
          "viewer",
        ]),
        custom_role_id: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.prisma.organizationMember.update({
      where: { id: data.member_id },
      data: { role: data.role, custom_role_id: data.custom_role_id ?? null }
    });
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ member_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.prisma.organizationMember.delete({
      where: { id: data.member_id }
    });
    return { ok: true };
  });

// ================================================================
// Invitations
// ================================================================

export const listInvitations = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ organization_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await context.prisma.invitation.findMany({
      where: { organization_id: data.organization_id },
      orderBy: { created_at: "desc" }
    });
    return rows ?? [];
  });

export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        organization_id: z.string(),
        email: z.string().trim().email().max(255),
        role: z.enum([
          "admin",
          "manager",
          "developer",
          "designer",
          "qa",
          "devops",
          "finance",
          "viewer",
        ]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const row = await context.prisma.invitation.create({
      data: {
        organization_id: data.organization_id,
        email: data.email.toLowerCase(),
        role: data.role,
        status: "pending",
        token: Math.random().toString(36).slice(2),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
    return row;
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ invitation_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.prisma.invitation.update({
      where: { id: data.invitation_id },
      data: { status: "revoked" }
    });
    return { ok: true };
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ token: z.string().min(2).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const inv = await context.prisma.invitation.findUnique({
      where: { token: data.token }
    });
    if (!inv) throw new Error("Invalid token");
    
    await context.prisma.organizationMember.create({
      data: {
        organization_id: inv.organization_id,
        user_id: context.userId,
        role: inv.role,
        status: "active"
      }
    });
    
    await context.prisma.invitation.update({
      where: { id: inv.id },
      data: { status: "accepted" }
    });
    
    return { organization_id: inv.organization_id };
  });

export const lookupInvitation = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ token: z.string().min(2).max(200) }).parse(input))
  .handler(async ({ data }) => {
    // Requires instantiating Prisma since it's not authenticated route
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const row = await prisma.invitation.findUnique({
      where: { token: data.token }
    });
    
    if (!row) return null;
    return row;
  });

// ================================================================
// Roles & Permissions
// ================================================================

export const listPermissions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const data = await context.prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }]
    });
    return data ?? [];
  });

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ organization_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await context.prisma.role.findMany({
      where: { organization_id: data.organization_id },
      orderBy: [{ is_system: "desc" }, { name: "asc" }]
    });
    return rows.map((r: any) => ({ ...r, permission_ids: [] }));
  });

export const createRole = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        organization_id: z.string(),
        name: z.string().trim().min(2).max(60),
        description: z.string().trim().max(300).optional(),
        permission_ids: z.array(z.string()).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 5)}`;
    const role = await context.prisma.role.create({
      data: {
        organization_id: data.organization_id,
        name: data.name,
        slug,
        description: data.description ?? null,
        is_system: false,
      }
    });
    return role;
  });

export const updateRolePermissions = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        role_id: z.string(),
        permission_ids: z.array(z.string()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    return { ok: true };
  });

export const deleteRole = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ role_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.prisma.role.delete({
      where: { id: data.role_id }
    });
    return { ok: true };
  });

// ================================================================
// Audit logs
// ================================================================

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ organization_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await context.prisma.auditLog.findMany({
      where: { organization_id: data.organization_id },
      orderBy: { created_at: "desc" },
      take: 200
    });
    return rows ?? [];
  });

// ================================================================
// Project members
// ================================================================

export const listProjectMembers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ project_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await context.prisma.projectMember.findMany({
      where: { project_id: data.project_id },
      orderBy: { created_at: "desc" }
    });
    return rows ?? [];
  });

export const addProjectMember = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        project_id: z.string(),
        user_id: z.string(),
        role: z
          .enum(["manager", "developer", "designer", "qa", "devops", "viewer"])
          .default("developer"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.prisma.projectMember.create({
      data: {
        project_id: data.project_id,
        user_id: data.user_id,
        role: data.role,
      }
    });
    return { ok: true };
  });

// ================================================================
// Integrations / Notifications / Profile
// ================================================================

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input) => z.object({ organization_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = await context.prisma.integrationConnection.findMany({
      where: { organization_id: data.organization_id }
    });
    return rows ?? [];
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const data = await context.prisma.notification.findMany({
      orderBy: { created_at: "desc" },
      take: 50
    });
    return data ?? [];
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const data = await context.prisma.profile.findUnique({
      where: { user_id: context.userId }
    });
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        full_name: z.string().trim().max(100).optional(),
        headline: z.string().trim().max(200).optional(),
        avatar_url: z.string().trim().url().max(500).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const row = await context.prisma.profile.update({
      where: { user_id: context.userId },
      data: {
        full_name: data.full_name ?? null,
        headline: data.headline ?? null,
        avatar_url: data.avatar_url || null,
      }
    });
    return row;
  });
