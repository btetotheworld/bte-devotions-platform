import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create roles
  const roles = [
    { name: "CHURCH_ADMIN", description: "Church administrator with full access" },
    { name: "CREATOR", description: "Content creator who can publish devotions" },
    { name: "MEMBER", description: "Regular member who can subscribe to devotions" },
  ];

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`Created/Updated role: ${role.name}`);
  }

  // Create a test church (optional - for development)
  const testChurch = await prisma.church.upsert({
    where: { slug: "test-church" },
    update: {},
    create: {
      name: "Test Church",
      slug: "test-church",
      settings: JSON.stringify({ theme: "default" }),
    },
  });
  console.log(`Created/Updated church: ${testChurch.name}`);

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

