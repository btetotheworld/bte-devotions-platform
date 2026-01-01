import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create roles
  const roles = [
    { name: "CREATOR", description: "Content creator who can publish devotions and articles" },
    { name: "CREATOR_ADMIN", description: "Admin who can manage a creator's content" },
    { name: "SUBSCRIBER", description: "Regular subscriber who can subscribe to creators" },
  ];

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`Created/Updated role: ${role.name}`);
  }

  console.log("Seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
