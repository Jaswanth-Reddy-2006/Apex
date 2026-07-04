import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found.");
    return;
  }
  const newUserId = user.id;

  console.log(`Migrating data to new user ID: ${newUserId}`);

  // Update Organizations
  const res1 = await prisma.organization.updateMany({
    data: { owner_id: newUserId }
  });
  console.log(`Updated ${res1.count} Organizations.`);

  // Update Organization Members
  const res2 = await prisma.organizationMember.updateMany({
    data: { user_id: newUserId }
  });
  console.log(`Updated ${res2.count} OrganizationMembers.`);

  // Update Projects
  const res3 = await prisma.project.updateMany({
    data: { created_by: newUserId }
  });
  console.log(`Updated ${res3.count} Projects.`);

  // Update Project Members
  const res4 = await prisma.projectMember.updateMany({
    data: { user_id: newUserId }
  });
  console.log(`Updated ${res4.count} ProjectMembers.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
