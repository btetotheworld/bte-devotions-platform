import { prisma } from "@bte-devotions/database";
import type { TenantContext } from "../types/tenant";

/**
 * Get tenant context for a user (creator-based)
 */
export async function getTenantContext(userId: string, creatorId: string): Promise<TenantContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
  });

  if (!creator) {
    return null;
  }

  return {
    creator,
    user,
    creatorId: creator.id,
    userId: user.id,
  };
}

/**
 * Enforce tenant isolation by adding creator_id filter to Prisma query
 */
export function enforceTenantIsolation<T extends { where?: Record<string, unknown> }>(
  query: T,
  creatorId: string
): T {
  return {
    ...query,
    where: {
      ...query.where,
      creatorId,
    },
  };
}

/**
 * Check if user has access to a creator
 */
export async function checkTenantAccess(userId: string, creatorId: string): Promise<boolean> {
  // Check if user is the creator
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      creator: true,
    },
  });

  if (user?.creator?.id === creatorId) {
    return true;
  }

  // Check if user has a role to manage this creator
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      creatorId,
      role: {
        name: "CREATOR_ADMIN",
      },
    },
  });

  return !!userRole;
}

/**
 * Get user's creator ID (if user is a creator)
 */
export async function getUserCreatorId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      creator: true,
    },
  });

  return user?.creator?.id || null;
}

/**
 * Get creators user can manage
 */
export async function getUserManagedCreators(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      role: {
        name: "CREATOR_ADMIN",
      },
    },
    select: {
      creatorId: true,
    },
  });

  return userRoles.map((ur) => ur.creatorId);
}
