import { prisma } from "./prisma.js";

export async function checkPermission(userId: string, orgId: string, permissionKey: string) {
  const member = await prisma.organizationMember.findFirst({
    where: { user_id: userId, organization_id: orgId },
  });
  
  if (!member) throw new Error("403 Forbidden: Not a member of this organization.");

  let roleId = member.custom_role_id;
  
  if (!roleId && member.role) {
    const roleMapping: Record<string, string> = {
      'owner': 'owner',
      'admin': 'admin',
      'manager': 'manager',
      'developer': 'developer',
      'designer': 'designer',
      'qa': 'qa',
      'hr': 'hr',
      'finance': 'finance',
      'sales': 'sales',
      'viewer': 'viewer'
    };
    const roleName = roleMapping[member.role.toLowerCase()] || 'viewer';
    const role = await prisma.role.findFirst({ where: { name: roleName, is_system: true } });
    if (role) {
      roleId = role.id;
    }
  }

  if (!roleId) {
    throw new Error("403 Forbidden: No role assigned.");
  }

  // Get the permission record
  const perm = await prisma.permission.findFirst({ where: { key: permissionKey } });
  if (!perm) {
    throw new Error(`System Error: Permission ${permissionKey} not found.`);
  }

  const rolePerm = await prisma.rolePermission.findFirst({
    where: { role_id: roleId, permission_id: perm.id }
  });

  if (!rolePerm) {
    throw new Error(`403 Forbidden: You do not have the required permission (${permissionKey}).`);
  }
}

export async function getUserPermissions(userId: string, orgId: string): Promise<string[]> {
  const member = await prisma.organizationMember.findFirst({
    where: { user_id: userId, organization_id: orgId },
  });
  
  if (!member) return [];

  let roleId = member.custom_role_id;
  if (!roleId && member.role) {
    const roleMapping: Record<string, string> = {
      'owner': 'owner',
      'admin': 'admin',
      'manager': 'manager',
      'developer': 'developer',
      'designer': 'designer',
      'qa': 'qa',
      'hr': 'hr',
      'finance': 'finance',
      'sales': 'sales',
      'viewer': 'viewer'
    };
    const roleName = roleMapping[member.role.toLowerCase()] || 'viewer';
    const role = await prisma.role.findFirst({ where: { name: roleName, is_system: true } });
    if (role) roleId = role.id;
  }

  if (!roleId) return [];

  const rolePerms = await prisma.rolePermission.findMany({
    where: { role_id: roleId }
  });

  if (rolePerms.length === 0) return [];

  const perms = await prisma.permission.findMany({
    where: { id: { in: rolePerms.map(rp => rp.permission_id) } }
  });

  return perms.map(p => p.key);
}
