import { beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import path from "path";

const TEST_DB_URL = process.env.TEST_DATABASE_URL || "file:./tests/test.db";

// Set DATABASE_URL for the database package
process.env.DATABASE_URL = TEST_DB_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DB_URL,
    },
  },
});

beforeAll(async () => {
  // Push schema to test database
  try {
    execSync(
      `cd packages/database/prisma && DATABASE_URL="${TEST_DB_URL}" bun prisma db push --skip-generate`,
      { stdio: "inherit" }
    );
  } catch (error) {
    console.warn("Failed to push schema, continuing anyway:", error);
  }

  // Set up test database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test (in reverse order of dependencies)
  // Use transactions to ensure atomic cleanup
  await prisma.$transaction(async (tx) => {
    await tx.ghostAuthorMapping.deleteMany();
    await tx.subscription.deleteMany();
    await tx.userRole.deleteMany();
    await tx.creator.deleteMany();
    await tx.user.deleteMany();
    await tx.role.deleteMany();
  });
});

export { prisma };
