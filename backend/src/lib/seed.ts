import { prisma } from "./prisma.js";

export async function seedDefaultRolesAndPermissions() {
  try {
    const existingPermCount = await prisma.permission.count();
    if (existingPermCount > 0) {
      return;
    }

    console.log("[Seed] Seeding default permissions and roles...");

    const permissionsData = [
      { key: "Chat.Access", name: "AI Chat Access", category: "Chat", description: "Allows access to per-project AI Chat" },
      { key: "Project.View", name: "View Projects", category: "Project", description: "Allows viewing projects" },
      { key: "Project.Create", name: "Create Projects", category: "Project", description: "Allows creating new projects" },
      { key: "People.View", name: "View Members", category: "People", description: "Allows viewing team members" },
      { key: "People.Invite", name: "Invite Members", category: "People", description: "Allows inviting new team members" },
      { key: "Roles.Manage", name: "Manage Roles", category: "Roles", description: "Allows managing organization roles" },
      { key: "Integrations.Connect", name: "Connect Integrations", category: "Integrations", description: "Allows connecting third-party tools" },
      { key: "Analytics.View", name: "View Analytics", category: "Analytics", description: "Allows viewing analytics dashboards" },
      { key: "Billing.View", name: "View Billing", category: "Billing", description: "Allows viewing billing information" },
      { key: "Audit.View", name: "View Audit Logs", category: "Audit", description: "Allows viewing audit logs" },
    ];

    const seededPerms = [];
    for (const p of permissionsData) {
      const dbPerm = await prisma.permission.create({
        data: {
          key: p.key,
          name: p.name,
          category: p.category,
          description: p.description,
        },
      });
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
      const dbRole = await prisma.role.create({
        data: {
          name: r.name,
          description: r.description,
          is_system: true,
          organization_id: null,
        },
      });

      let assignedKeys: string[] = [];
      if (r.name === "owner" || r.name === "admin") {
        assignedKeys = seededPerms.map((p) => p.key);
      } else if (r.name === "manager") {
        assignedKeys = ["Chat.Access", "Project.View", "Project.Create", "People.View", "People.Invite", "Analytics.View"];
      } else if (r.name === "developer") {
        assignedKeys = ["Chat.Access", "Project.View", "People.View"];
      } else if (r.name === "designer") {
        assignedKeys = ["Chat.Access", "Project.View", "People.View"];
      } else if (r.name === "qa") {
        assignedKeys = ["Chat.Access", "Project.View", "People.View"];
      } else if (r.name === "devops") {
        assignedKeys = ["Chat.Access", "Project.View", "People.View", "Analytics.View"];
      } else if (r.name === "finance") {
        assignedKeys = ["Project.View", "Billing.View"];
      } else if (r.name === "viewer") {
        assignedKeys = ["Project.View"];
      }

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

    console.log("[Seed] Default permissions, roles, and mappings seeded successfully.");
  } catch (err) {
    console.warn("[Seed] Error during seeding:", err);
  }
}
export default seedDefaultRolesAndPermissions;
