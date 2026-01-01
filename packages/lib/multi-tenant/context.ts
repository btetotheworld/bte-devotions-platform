import { prisma } from "@bte-devotions/database";
import type { TenantContext } from "../types/tenant";

/**
 * Get tenant context for a user
 */
export async function getTenantContext(userId: string): Promise<TenantContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      church: true,
    },
  });

  if (!user || !user.church) {
    return null;
  }

  return {
    church: user.church,
    user,
    churchId: user.churchId,
    userId: user.id,
  };
}

/**
 * Enforce tenant isolation by adding church_id filter to Prisma query
 */
export function enforceTenantIsolation<T extends { where?: Record<string, unknown> }>(
  query: T,
  churchId: string
): T {
  return {
    ...query,
    where: {
      ...query.where,
      churchId,
    },
  };
}

/**
 * Check if user has access to a church
 */
export async function checkTenantAccess(userId: string, churchId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { churchId: true },
  });

  return user?.churchId === churchId;
}

/**
 * Get user's church ID
 */
export async function getUserChurchId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { churchId: true },
  });

  return user?.churchId || null;
}

