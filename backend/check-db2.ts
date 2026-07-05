import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const role = await prisma.role.findFirst({ where: { name: 'owner' }});
  if (!role) return console.log('owner role not found');
  const rolePerms = await prisma.rolePermission.findMany({ where: { role_id: role.id }});
  const perms = await prisma.permission.findMany({ where: { id: { in: rolePerms.map(rp => rp.permission_id) } }});
  console.log('Owner permissions:', perms.map(p => p.key));
}
main().finally(() => prisma.$disconnect());
