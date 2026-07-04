import { prisma } from "./prisma.js";

function getPrismaModelName(table: string): string {
  const mapping: Record<string, string> = {
    profiles: "profile",
    organizations: "organization",
    organization_members: "organizationMember",
    workspaces: "workspace",
    projects: "project",
    project_members: "projectMember",
    invitations: "invitation",
    roles: "role",
    permissions: "permission",
    role_permissions: "rolePermission",
    user_roles: "userRole",
    chat_conversations: "chatConversation",
    chat_messages: "chatMessage",
    chat_uploads: "chatUpload",
    documents: "document",
    knowledge_sources: "knowledgeSource",
    notifications: "notification",
    audit_logs: "auditLog",
    activity_logs: "activityLog",
    api_keys: "apiKey",
    integration_connections: "integrationConnection",
  };
  return mapping[table] || table;
}

class PrismaSupabaseBuilder {
  private table: string;
  private modelName: string;
  private prismaModel: any;
  private filters: any = {};
  private orderBy: any[] = [];
  private limitCount?: number;
  private action?: "select" | "insert" | "update" | "delete";
  private actionData: any = null;
  private selectFields?: string;

  constructor(table: string) {
    this.table = table;
    this.modelName = getPrismaModelName(table);
    this.prismaModel = (prisma as any)[this.modelName];
  }

  select(fields?: string) {
    this.action = "select";
    this.selectFields = fields;
    return this;
  }

  insert(data: any) {
    this.action = "insert";
    this.actionData = data;
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.actionData = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  neq(column: string, value: any) {
    this.filters[column] = { not: value };
    return this;
  }

  in(column: string, values: any[]) {
    this.filters[column] = { in: values };
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending === false ? "desc" : "asc";
    this.orderBy.push({ [column]: direction });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  // Chainable fallback for textSearch
  textSearch(column: string, query: string) {
    this.filters[column] = { contains: query, mode: "insensitive" };
    return this;
  }

  async then(onfulfilled?: any, onrejected?: any) {
    try {
      const res = await this.execute();
      return onfulfilled ? onfulfilled(res) : res;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  async execute() {
    let result: any;

    if (!this.prismaModel) {
      return { data: null, error: new Error(`Prisma model not found for table ${this.table}`) };
    }

    try {
      if (this.action === "select") {
        // Intercept specific nested joins
        if (this.table === "roles" && this.selectFields?.includes("role_permissions")) {
          const rows = await this.prismaModel.findMany({
            where: this.filters,
            orderBy: this.orderBy,
          });
          const data = await Promise.all(
            rows.map(async (role: any) => {
              const rolePerms = await prisma.rolePermission.findMany({
                where: { role_id: role.id },
              });
              return {
                ...role,
                role_permissions: rolePerms.map((rp) => ({ permission_id: rp.permission_id })),
              };
            }),
          );
          result = { data, error: null };
        } else if (this.table === "project_members" && this.selectFields?.includes("profiles")) {
          const rows = await this.prismaModel.findMany({
            where: this.filters,
          });
          const data = await Promise.all(
            rows.map(async (member: any) => {
              const profile = await prisma.profile.findFirst({
                where: { id: member.user_id },
              });
              return {
                ...member,
                profiles: profile
                  ? {
                      email: profile.email,
                      full_name: profile.full_name,
                      avatar_url: profile.avatar_url,
                    }
                  : null,
              };
            }),
          );
          result = { data, error: null };
        } else if (this.table === "chat_messages" && this.selectFields?.includes("chat_conversations")) {
          const projectId = this.filters["chat_conversations.project_id"] || this.filters["project_id"];
          let conversations: any[] = [];
          if (projectId) {
            conversations = await prisma.chatConversation.findMany({
              where: { project_id: projectId },
            });
          } else {
            conversations = await prisma.chatConversation.findMany();
          }

          const convIds = conversations.map((c) => c.id);
          const searchFilter: any = {
            conversation_id: { in: convIds },
          };

          if (this.filters["content"]) {
            searchFilter["content"] = this.filters["content"];
          }

          const messages = await prisma.chatMessage.findMany({
            where: searchFilter,
            orderBy: { created_at: "desc" },
          });

          const data = messages.map((msg) => {
            const conv = conversations.find((c) => c.id === msg.conversation_id);
            return {
              conversation_id: msg.conversation_id,
              content: msg.content,
              created_at: msg.created_at,
              chat_conversations: conv
                ? {
                    id: conv.id,
                    title: conv.title,
                    project_id: conv.project_id,
                  }
                : null,
            };
          });
          result = { data, error: null };
        } else if (this.table === "organization_members" && this.selectFields?.includes("organizations")) {
          const rows = await this.prismaModel.findMany({
            where: this.filters,
          });
          const data = await Promise.all(
            rows.map(async (m: any) => {
              const org = await prisma.organization.findFirst({
                where: { id: m.organization_id },
              });
              const role = m.custom_role_id
                ? await prisma.role.findFirst({
                    where: { id: m.custom_role_id },
                  })
                : null;

              return {
                id: m.id,
                role: m.role,
                custom_role_id: m.custom_role_id,
                organization_id: m.organization_id,
                organizations: org
                  ? {
                      id: org.id,
                      name: org.name,
                      slug: org.slug,
                      logo_url: org.logo_url,
                    }
                  : null,
                roles: role
                  ? {
                      slug: role.name.toLowerCase().replace(/ /g, "-"),
                      name: role.name,
                    }
                  : null,
              };
            }),
          );
          result = { data, error: null };
        } else {
          // Standard findMany
          const queryArgs: any = {
            where: this.filters,
          };
          if (this.orderBy.length > 0) {
            queryArgs.orderBy = this.orderBy;
          }
          if (this.limitCount !== undefined) {
            queryArgs.take = this.limitCount;
          }

          const rows = await this.prismaModel.findMany(queryArgs);
          result = { data: rows, error: null };
        }
      } else if (this.action === "insert") {
        if (this.table === "organizations" && !Array.isArray(this.actionData)) {
          // Atomically create organization and organization member
          const org = await prisma.$transaction(async (tx) => {
            const row = await tx.organization.create({ data: this.actionData });
            await tx.organizationMember.create({
              data: {
                organization_id: row.id,
                user_id: row.owner_id,
                role: "owner",
                status: "active",
              },
            });
            return row;
          });
          result = { data: org, error: null };
        } else if (Array.isArray(this.actionData)) {
          const rows = await Promise.all(this.actionData.map((data) => this.prismaModel.create({ data })));
          result = { data: rows, error: null };
        } else {
          const row = await this.prismaModel.create({ data: this.actionData });
          result = { data: row, error: null };
        }
      } else if (this.action === "update") {
        await this.prismaModel.updateMany({
          where: this.filters,
          data: this.actionData,
        });
        const updated = await this.prismaModel.findMany({ where: this.filters });
        result = { data: updated, error: null };
      } else if (this.action === "delete") {
        const deleted = await this.prismaModel.findMany({ where: this.filters });
        await this.prismaModel.deleteMany({
          where: this.filters,
        });
        result = { data: deleted, error: null };
      }
    } catch (err: any) {
      result = { data: null, error: err };
    }

    return result;
  }

  async maybeSingle() {
    const res = await this.execute();
    if (res.error) return res;
    const data = res.data;
    const item = Array.isArray(data) ? data[0] : data;
    return { data: item || null, error: null };
  }

  async single() {
    const res = await this.execute();
    if (res.error) return res;
    const data = res.data;
    const item = Array.isArray(data) ? data[0] : data;
    if (!item) {
      return { data: null, error: new Error("No row found") };
    }
    return { data: item, error: null };
  }
}

// Helpers for RPC functions
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);

async function bootstrapOrganizationHelper(userId: string, data: any) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const slug = `${slugify(data._name || "org")}-${Math.random().toString(36).slice(2, 6)}`;
      const org = await tx.organization.create({
        data: {
          name: data._name,
          slug,
          description: data._description || null,
          domain: data._domain || null,
          industry: data._industry || null,
          employee_count: data._employee_count || null,
          country: data._country || null,
          timezone: data._timezone || null,
          phone: data._phone || null,
          logo_url: data._logo_url || null,
          owner_id: userId,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          organization_id: org.id,
          name: "Default Workspace",
          slug: "default",
        },
      });

      const project = await tx.project.create({
        data: {
          organization_id: org.id,
          workspace_id: workspace.id,
          name: data._default_project_name || "First Project",
          slug: slugify(data._default_project_name || "First Project"),
          status: "active",
          created_by: userId,
        },
      });

      await tx.organizationMember.create({
        data: {
          organization_id: org.id,
          user_id: userId,
          role: "owner",
          status: "active",
        },
      });

      await tx.projectMember.create({
        data: {
          project_id: project.id,
          user_id: userId,
          role: "manager",
        },
      });

      return [
        {
          organization_id: org.id,
          workspace_id: workspace.id,
          project_id: project.id,
        },
      ];
    });

    return { data: result, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

async function acceptInvitationHelper(userId: string, data: any) {
  try {
    const invitation = await prisma.invitation.findFirst({
      where: { token: data._token, status: "pending" },
    });
    if (!invitation) throw new Error("Invalid or already accepted invitation");
    if (new Date() > new Date(invitation.expires_at)) throw new Error("Invitation expired");

    const result = await prisma.$transaction(async (tx) => {
      await tx.organizationMember.create({
        data: {
          organization_id: invitation.organization_id,
          user_id: userId,
          role: invitation.role,
          status: "active",
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });

      return invitation.organization_id;
    });

    return { data: result, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

async function getInvitationByTokenHelper(data: any) {
  try {
    const invitation = await prisma.invitation.findFirst({
      where: { token: data._token },
    });
    if (!invitation) return { data: [], error: null };

    const org = await prisma.organization.findUnique({
      where: { id: invitation.organization_id },
    });

    return {
      data: [
        {
          email: invitation.email,
          expires_at: invitation.expires_at.toISOString(),
          organization_id: invitation.organization_id,
          organization_name: org?.name || "Unknown Organization",
          role: invitation.role,
          status: invitation.status,
        },
      ],
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

async function myOrgPermissionsHelper(userId: string, data: any) {
  try {
    const member = await prisma.organizationMember.findFirst({
      where: { organization_id: data._org_id, user_id: userId },
    });
    if (!member) return { data: [], error: null };

    let roleId = member.custom_role_id;
    if (!roleId) {
      const systemRole = await prisma.role.findFirst({
        where: { organization_id: null, name: member.role },
      });
      if (systemRole) roleId = systemRole.id;
    }

    let perms: any[] = [];
    if (roleId) {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { role_id: roleId },
      });
      perms = await prisma.permission.findMany({
        where: { id: { in: rolePermissions.map((rp) => rp.permission_id) } },
      });
    } else if (member.role === "owner" || member.role === "admin") {
      perms = await prisma.permission.findMany();
    }

    const result = perms.map((p) => ({ permission_key: p.id }));
    return { data: result, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export function createSupabasePrismaClient(userId: string, email?: string, userMetadata?: any) {
  const client = {
    auth: {
      getUser: async (token?: string) => {
        // Find user by ID in profile table
        let profile = await prisma.profile.findUnique({
          where: { id: userId },
        });
        if (!profile) {
          try {
            // Auto-create local profile if missing
            const fullName = userMetadata?.full_name || userMetadata?.name || null;
            const avatarUrl = userMetadata?.avatar_url || null;
            profile = await prisma.profile.create({
              data: {
                id: userId,
                email: email || "user@example.com",
                full_name: fullName,
                avatar_url: avatarUrl,
              },
            });
            console.log(`[Adapter] Auto-created local profile for user ID: ${userId}`);
          } catch (err: any) {
            return { data: { user: null }, error: new Error(`User profile not found and auto-creation failed: ${err.message}`) };
          }
        }
        return { data: { user: profile }, error: null };
      },
    },
    from: (table: string) => new PrismaSupabaseBuilder(table),
    rpc: async (fnName: string, args: any) => {
      if (fnName === "bootstrap_organization") {
        return bootstrapOrganizationHelper(userId, args);
      }
      if (fnName === "accept_invitation") {
        return acceptInvitationHelper(userId, args);
      }
      if (fnName === "get_invitation_by_token") {
        return getInvitationByTokenHelper(args);
      }
      if (fnName === "my_org_permissions") {
        return myOrgPermissionsHelper(userId, args);
      }
      return { data: null, error: new Error(`RPC function ${fnName} not supported in adapter`) };
    },
  };
  return client;
}
export default createSupabasePrismaClient;
