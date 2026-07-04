import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { prisma } from "../lib/prisma.js";

/**
 * APEX server-side RPCs. All calls are typed, Zod-validated, and RLS-scoped
 * via the authenticated supabase client from `requireSupabaseAuth`.
 */

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
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("organizations")
      .select(
        "id, name, slug, description, logo_url, domain, industry, employee_count, country, timezone, phone, created_at, updated_at, owner_id",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
    const { data: row, error } = await context.supabase
      .from("organizations")
      .insert({
        name: data.name,
        slug,
        description: data.description ?? null,
        owner_id: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/**
 * Atomically create the organization, its default workspace, its first project,
 * and mark the caller as owner + project manager.
 */
export const bootstrapOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
    const { data: row, error } = await context.supabase.rpc("bootstrap_organization", {
      _name: data.name,
      _description: data.description ?? "",
      _domain: data.domain ?? "",
      _industry: data.industry ?? "",
      _employee_count: data.employee_count ?? "",
      _country: data.country ?? "",
      _timezone: data.timezone ?? "",
      _phone: data.phone ?? "",
      _logo_url: data.logo_url ?? "",
      _default_project_name: data.default_project_name ?? "First Project",
    });
    if (error) throw new Error(error.message);
    const rec = Array.isArray(row) ? row[0] : row;
    return rec as { organization_id: string; workspace_id: string; project_id: string };
  });

// ================================================================
// Dashboard
// ================================================================

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [orgs, projects, members, integrations] = await Promise.all([
      context.supabase.from("organizations").select("id", { count: "exact", head: true }),
      context.supabase.from("projects").select("id", { count: "exact", head: true }),
      context.supabase.from("organization_members").select("id", { count: "exact", head: true }),
      context.supabase
        .from("integration_connections")
        .select("id", { count: "exact", head: true })
        .eq("status", "connected"),
    ]);
    return {
      organizations: orgs.count ?? 0,
      projects: projects.count ?? 0,
      members: members.count ?? 0,
      integrations: integrations.count ?? 0,
    };
  });

export const listRecentActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("activity_logs")
      .select("id, action, target_type, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ================================================================
// Projects
// ================================================================

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("id, name, slug, description, status, created_at, organization_id, workspace_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        organization_id: z.string().uuid(),
        name: z.string().trim().min(2).max(80),
        description: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({
        organization_id: data.organization_id,
        name: data.name,
        slug: slugify(data.name),
        description: data.description ?? null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ================================================================
// Workspaces
// ================================================================

export const listWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("workspaces")
      .select("id, name, slug, description, organization_id, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ================================================================
// Members
// ================================================================

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("organization_members")
      .select(
        "id, role, custom_role_id, department, designation, phone, status, user_id, organization_id, created_at, profiles:user_id(email, full_name, avatar_url)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        member_id: z.string().uuid(),
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
        custom_role_id: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("organization_members")
      .update({ role: data.role, custom_role_id: data.custom_role_id ?? null })
      .eq("id", data.member_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ member_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("organization_members")
      .delete()
      .eq("id", data.member_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================================================================
// Invitations
// ================================================================

export const listInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ organization_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("invitations")
      .select("id, email, role, status, token, expires_at, created_at, organization_id")
      .eq("organization_id", data.organization_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        organization_id: z.string().uuid(),
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
    const { data: row, error } = await context.supabase
      .from("invitations")
      .insert({
        organization_id: data.organization_id,
        email: data.email.toLowerCase(),
        role: data.role,
        invited_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ invitation_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("invitations")
      .update({ status: "revoked" })
      .eq("id", data.invitation_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ token: z.string().min(10).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: orgId, error } = await context.supabase.rpc("accept_invitation", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    return { organization_id: orgId as string };
  });

/**
 * Public lookup — safe to call without an authenticated session so the
 * accept-invite landing page can show the org name before login/signup.
 */
export const lookupInvitation = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ token: z.string().min(10).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: rows, error } = await client.rpc("get_invitation_by_token", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return null;
    return row as {
      organization_id: string;
      organization_name: string;
      email: string;
      role: string;
      status: string;
      expires_at: string;
    };
  });

// ================================================================
// Roles & Permissions
// ================================================================

export const listPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("permissions")
      .select("id, key, category, description")
      .order("category")
      .order("key");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ organization_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("roles")
      .select("id, name, slug, description, is_system, created_at, role_permissions(permission_id)")
      .eq("organization_id", data.organization_id)
      .order("is_system", { ascending: false })
      .order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      is_system: r.is_system,
      created_at: r.created_at,
      permission_ids: ((r.role_permissions as Array<{ permission_id: string }>) ?? []).map(
        (p) => p.permission_id,
      ),
    }));
  });

export const createRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        organization_id: z.string().uuid(),
        name: z.string().trim().min(2).max(60),
        description: z.string().trim().max(300).optional(),
        permission_ids: z.array(z.string().uuid()).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 5)}`;
    const { data: role, error } = await context.supabase
      .from("roles")
      .insert({
        organization_id: data.organization_id,
        name: data.name,
        slug,
        description: data.description ?? null,
        is_system: false,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data.permission_ids.length > 0) {
      const { error: pErr } = await context.supabase
        .from("role_permissions")
        .insert(data.permission_ids.map((pid) => ({ role_id: role.id, permission_id: pid })));
      if (pErr) throw new Error(pErr.message);
    }
    return role;
  });

export const updateRolePermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        role_id: z.string().uuid(),
        permission_ids: z.array(z.string().uuid()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error: dErr } = await context.supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", data.role_id);
    if (dErr) throw new Error(dErr.message);
    if (data.permission_ids.length > 0) {
      const { error: iErr } = await context.supabase
        .from("role_permissions")
        .insert(
          data.permission_ids.map((pid) => ({ role_id: data.role_id, permission_id: pid })),
        );
      if (iErr) throw new Error(iErr.message);
    }
    return { ok: true };
  });

export const deleteRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ role_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("roles")
      .delete()
      .eq("id", data.role_id)
      .eq("is_system", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================================================================
// Audit logs
// ================================================================

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ organization_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("audit_logs")
      .select("id, action, resource, actor_id, metadata, created_at")
      .eq("organization_id", data.organization_id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ================================================================
// Project members
// ================================================================

export const listProjectMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("project_members")
      .select("id, role, user_id, created_at, profiles:user_id(email, full_name, avatar_url)")
      .eq("project_id", data.project_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addProjectMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        project_id: z.string().uuid(),
        user_id: z.string().uuid(),
        role: z
          .enum(["manager", "developer", "designer", "qa", "devops", "viewer"])
          .default("developer"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("project_members")
      .insert({
        project_id: data.project_id,
        user_id: data.user_id,
        role: data.role,
        added_by: context.userId,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================================================================
// Integrations / Notifications / Profile
// ================================================================

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("integration_connections")
      .select("id, provider, display_name, status, last_sync_at, organization_id");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
    const { data: row, error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.full_name ?? null,
        headline: data.headline ?? null,
        avatar_url: data.avatar_url || null,
      })
      .eq("id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const connectGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      code: z.string(),
      organization_id: z.string(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { code, organization_id } = data;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("GitHub OAuth credentials not configured on the backend server.");
    }

    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to exchange GitHub authorization code: ${errorText}`);
    }

    const tokenData: any = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(`GitHub OAuth exchange error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated GitHub user details
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "APEX-App",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch authenticated GitHub user details.");
    }

    const userData: any = await userResponse.json();
    const githubUsername = userData.login;

    // 3. Upsert integration connection
    await prisma.integrationConnection.upsert({
      where: {
        organization_id_provider: {
          organization_id,
          provider: "github",
        },
      },
      update: {
        status: "connected",
        display_name: githubUsername,
        credentials_vault_key: accessToken,
        last_sync_at: new Date(),
        connected_by: context.userId,
      },
      create: {
        organization_id,
        provider: "github",
        status: "connected",
        display_name: githubUsername,
        credentials_vault_key: accessToken,
        connected_by: context.userId,
      },
    });

    return { success: true, username: githubUsername };
  });

