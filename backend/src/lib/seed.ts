import { prisma } from "./prisma.js";

export async function seedDefaultRolesAndPermissions() {
  try {
    console.log("[Seed] Syncing default permissions and roles...");

    const permissionsData = [
      // Organization
      { key: "Org.Manage", name: "Manage Organization", category: "Organization", description: "Allows managing organization settings" },
      { key: "Workspace.Read", name: "Read Workspaces", category: "Workspace", description: "Allows viewing workspaces" },

      // AI Chat
      { key: "Chat.Create", name: "Create AI Chats", category: "Chat", description: "Allows creating AI chats" },
      { key: "Chat.Read", name: "Read AI Chats", category: "Chat", description: "Allows reading AI chats" },
      { key: "Chat.Update", name: "Update AI Chats", category: "Chat", description: "Allows updating AI chats" },
      { key: "Chat.Delete", name: "Delete AI Chats", category: "Chat", description: "Allows deleting AI chats" },

      // Projects
      { key: "Project.Create", name: "Create Projects", category: "Project", description: "Allows creating projects" },
      { key: "Project.Read", name: "Read Projects", category: "Project", description: "Allows reading projects" },
      { key: "Project.Update", name: "Update Projects", category: "Project", description: "Allows updating projects" },
      { key: "Project.Delete", name: "Delete Projects", category: "Project", description: "Allows deleting projects" },

      // Members (People)
      { key: "People.Create", name: "Invite Members", category: "People", description: "Allows inviting members" },
      { key: "People.Read", name: "Read Members", category: "People", description: "Allows reading members list" },
      { key: "People.Update", name: "Update Members", category: "People", description: "Allows updating member roles" },
      { key: "People.Delete", name: "Delete Members", category: "People", description: "Allows removing members" },

      // Roles & Permissions
      { key: "Roles.Create", name: "Create Roles", category: "Roles", description: "Allows creating custom roles" },
      { key: "Roles.Read", name: "Read Roles", category: "Roles", description: "Allows reading custom roles" },
      { key: "Roles.Update", name: "Update Roles", category: "Roles", description: "Allows updating role permissions" },
      { key: "Roles.Delete", name: "Delete Roles", category: "Roles", description: "Allows deleting custom roles" },

      // Integrations
      { key: "Integrations.Create", name: "Create Integrations", category: "Integrations", description: "Allows connecting integrations" },
      { key: "Integrations.Read", name: "Read Integrations", category: "Integrations", description: "Allows reading integrations status" },
      { key: "Integrations.Update", name: "Update Integrations", category: "Integrations", description: "Allows editing integrations" },
      { key: "Integrations.Delete", name: "Delete Integrations", category: "Integrations", description: "Allows removing integrations" },

      // Analytics
      { key: "Analytics.Create", name: "Create Analytics Dashboards", category: "Analytics", description: "Allows creating analytics cards" },
      { key: "Analytics.Read", name: "Read Analytics", category: "Analytics", description: "Allows reading analytics statistics" },
      { key: "Analytics.Update", name: "Update Analytics", category: "Analytics", description: "Allows modifying analytics cards" },
      { key: "Analytics.Delete", name: "Delete Analytics", category: "Analytics", description: "Allows removing analytics cards" },

      // Billing
      { key: "Billing.Create", name: "Manage Billing Seats", category: "Billing", description: "Allows creating seats" },
      { key: "Billing.Read", name: "Read Billing Settings", category: "Billing", description: "Allows reading seat usage and invoices" },
      { key: "Billing.Update", name: "Update Billing Invoices", category: "Billing", description: "Allows editing billing profile" },
      { key: "Billing.Delete", name: "Cancel Billing subscription", category: "Billing", description: "Allows canceling seats" },

      // Audit Logs
      { key: "Audit.Create", name: "Create Audit entries", category: "Audit", description: "Allows manual audit additions" },
      { key: "Audit.Read", name: "Read Audit logs", category: "Audit", description: "Allows viewing audit reports" },
      { key: "Audit.Update", name: "Update Audit logs", category: "Audit", description: "Allows editing audit entries" },
      { key: "Audit.Delete", name: "Delete Audit logs", category: "Audit", description: "Allows removing audit reports" },
    ];

    const seededPerms = [];
    for (const p of permissionsData) {
      // Use findFirst and create if not found, since key is unique in permissions
      let dbPerm = await prisma.permission.findFirst({
        where: { key: p.key }
      });
      if (!dbPerm) {
        dbPerm = await prisma.permission.create({
          data: {
            key: p.key,
            name: p.name,
            category: p.category,
            description: p.description,
          },
        });
      }
      seededPerms.push(dbPerm);
    }

    const rolesData = [
      { name: "owner", description: "Owner of the organization with full permissions" },
      { name: "admin", description: "Administrator with organization-wide management access" },
      { name: "manager", description: "Project Manager responsible for projects and members" },
      { name: "developer", description: "Software Developer focused on building projects" },
      { name: "designer", description: "UI/UX Designer working on interfaces" },
      { name: "qa", description: "Quality Assurance engineer verifying releases" },
      { name: "devops", description: "DevOps Engineer managing pipelines and environments" },
      { name: "finance", description: "Finance Manager handling seat usage and invoices" },
      { name: "viewer", description: "Read-only workspace and project viewer" },
    ];

    for (const r of rolesData) {
      let dbRole = await prisma.role.findFirst({
        where: { is_system: true, name: r.name }
      });
      if (!dbRole) {
        dbRole = await prisma.role.create({
          data: {
            name: r.name,
            description: r.description,
            is_system: true,
            organization_id: null,
          },
        });
      }

      let assignedKeys: string[] = [];
      if (r.name === "owner" || r.name === "admin") {
        assignedKeys = seededPerms.map((p) => p.key);
      } else if (r.name === "manager") {
        assignedKeys = [
          "Chat.Create", "Chat.Read", "Chat.Update", "Chat.Delete",
          "Project.Create", "Project.Read", "Project.Update", "Project.Delete",
          "People.Create", "People.Read", "People.Update", "People.Delete",
          "Analytics.Read", "Roles.Read"
        ];
      } else if (["developer", "designer", "qa", "devops"].includes(r.name)) {
        assignedKeys = [
          "Chat.Create", "Chat.Read", "Chat.Update",
          "Project.Read", "People.Read"
        ];
        if (r.name === "devops") {
          assignedKeys.push("Analytics.Read");
        }
      } else if (r.name === "finance") {
        assignedKeys = ["Project.Read", "Billing.Read", "Billing.Create", "Billing.Update"];
      } else if (r.name === "viewer") {
        assignedKeys = ["Project.Read"];
      }

      // Delete existing role permissions for system roles to refresh mappings cleanly
      await prisma.rolePermission.deleteMany({
        where: { role_id: dbRole.id }
      });

      for (const key of assignedKeys) {
        const matchingPerm = seededPerms.find((p) => p.key === key);
        if (matchingPerm) {
          await prisma.rolePermission.create({
            data: {
              role_id: dbRole.id,
              permission_id: matchingPerm.id,
            },
          });
        }
      }
    }

    console.log("[Seed] Standard permissions, roles, and mappings synced successfully.");
  } catch (err) {
    console.warn("[Seed] Error during seeding:", err);
  }
}
export default seedDefaultRolesAndPermissions;
