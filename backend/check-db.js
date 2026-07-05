const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const roles = await prisma.role.findMany(); 
  console.log('roles:', roles.length); 
  const perms = await prisma.rolePermission.findMany(); 
  console.log('role permissions:', perms.length); 
  const members = await prisma.organizationMember.findMany(); 
  console.log('members:', members.length); 
  if (members.length > 0) {
    console.log(members[0]);
  }
} 
main().finally(() => prisma.$disconnect());
