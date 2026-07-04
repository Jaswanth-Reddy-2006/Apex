import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { key: 'Org.View', category: 'Organization' },
  { key: 'Org.Manage', category: 'Organization' },
  { key: 'Org.Delete', category: 'Organization' },
  { key: 'Workspace.View', category: 'Workspace' },
  { key: 'Workspace.Manage', category: 'Workspace' },
  { key: 'Project.View', category: 'Project' },
  { key: 'Project.Create', category: 'Project' },
  { key: 'Project.Manage', category: 'Project' },
  { key: 'People.View', category: 'People' },
  { key: 'People.Invite', category: 'People' },
  { key: 'People.Manage', category: 'People' },
  { key: 'Roles.View', category: 'Roles' },
  { key: 'Roles.Manage', category: 'Roles' },
  { key: 'Integrations.View', category: 'Integrations' },
  { key: 'Integrations.Connect', category: 'Integrations' },
  { key: 'Integrations.Manage', category: 'Integrations' },
  { key: 'Analytics.View', category: 'Analytics' },
  { key: 'AuditLogs.View', category: 'Audit' },
  { key: 'Notifications.View', category: 'Notifications' },
  { key: 'Billing.View', category: 'Billing' },
  { key: 'Billing.Manage', category: 'Billing' },
  { key: 'Chat.Access', category: 'AI' },
  { key: 'AI.Configure', category: 'AI' },
  { key: 'Code.Push', category: 'Engineering' },
  { key: 'Code.Review', category: 'Engineering' },
  { key: 'HR.Access', category: 'HR' },
  { key: 'Finance.Access', category: 'Finance' },
  { key: 'Sales.Access', category: 'Sales' },
  { key: 'Design.Access', category: 'Design' },
  { key: 'QA.Access', category: 'QA' },
];

const ROLES = [
  {
    name: 'Owner',
    description: 'Unrestricted access to the entire platform.',
    permissions: PERMISSIONS.map(p => p.key), // All permissions
  },
  {
    name: 'Organization Admin',
    description: 'Can manage the organization except ownership and billing.',
    permissions: PERMISSIONS.map(p => p.key).filter(
      p => !['Org.Delete', 'Billing.Manage', 'Billing.View'].includes(p)
    ),
  },
  {
    name: 'Project Manager',
    description: 'Can manage projects and team members within assigned workspaces.',
    permissions: ['Chat.Access', 'Project.View', 'Project.Create', 'Project.Manage', 'Workspace.View', 'People.View', 'Analytics.View', 'Notifications.View'],
  },
  {
    name: 'Team Lead',
    description: 'Can manage their own team and assigned projects.',
    permissions: ['Chat.Access', 'Project.View', 'Project.Manage', 'People.View', 'Notifications.View'],
  },
  {
    name: 'Developer',
    description: 'Can only work on assigned projects.',
    permissions: ['Chat.Access', 'Project.View', 'Notifications.View', 'Code.Push', 'Code.Review'],
  },
  {
    name: 'Designer',
    description: 'Can access design tools and assigned projects.',
    permissions: ['Chat.Access', 'Project.View', 'Notifications.View', 'Design.Access'],
  },
  {
    name: 'QA Engineer',
    description: 'Can access testing and bug reports.',
    permissions: ['Chat.Access', 'Project.View', 'Notifications.View', 'QA.Access'],
  },
  {
    name: 'HR',
    description: 'Can access HR and employee management.',
    permissions: ['Chat.Access', 'Notifications.View', 'HR.Access'],
  },
  {
    name: 'Finance',
    description: 'Can access financial data and billing.',
    permissions: ['Chat.Access', 'Analytics.View', 'AuditLogs.View', 'Billing.View', 'Billing.Manage', 'Finance.Access'],
  },
  {
    name: 'Sales',
    description: 'Can access CRM and sales data.',
    permissions: ['Chat.Access', 'Notifications.View', 'Sales.Access'],
  },
  {
    name: 'Guest',
    description: 'Read-only access to assigned projects.',
    permissions: ['Project.View'],
  }
];

async function main() {
  console.log('Seeding Permissions...');
  for (const perm of PERMISSIONS) {
    const existing = await prisma.permission.findFirst({ where: { key: perm.key } });
    if (!existing) {
      await prisma.permission.create({
        data: {
          key: perm.key,
          name: perm.key.replace('.', ' '),
          category: perm.category,
        }
      });
    }
  }

  console.log('Seeding Roles...');
  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map(p => [p.key, p.id]));

  for (const roleDef of ROLES) {
    let existingRole = await prisma.role.findFirst({ where: { name: roleDef.name, is_system: true } });
    if (!existingRole) {
      existingRole = await prisma.role.create({
        data: {
          name: roleDef.name,
          description: roleDef.description,
          is_system: true,
        }
      });
    }

    // Link permissions
    for (const pKey of roleDef.permissions) {
      const pId = permMap.get(pKey);
      if (pId) {
        const existingLink = await prisma.rolePermission.findFirst({
          where: { role_id: existingRole.id, permission_id: pId }
        });
        if (!existingLink) {
          await prisma.rolePermission.create({
            data: {
              role_id: existingRole.id,
              permission_id: pId
            }
          });
        }
      }
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
