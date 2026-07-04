import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
    const member = await prisma.organizationMember.findFirst({
      where: { organization_id: org.id, user_id: org.owner_id }
    });
    if (!member) {
      await prisma.organizationMember.create({
        data: {
          organization_id: org.id,
          user_id: org.owner_id,
          role: "owner",
          status: "active"
        }
      });
      console.log(`Added missing owner member for org ${org.name}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
