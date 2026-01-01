import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "../auth/session";
import { checkTenantAccess, enforceTenantIsolation } from "./context";
import type { AuthContext } from "../auth/middleware";

/**
 * Middleware wrapper that automatically injects creatorId from session
 * and enforces tenant isolation
 */
export function withTenant(
  handler: (
    req: NextRequest,
    auth: AuthContext,
    tenantContext: { creatorId: string }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const session = await getSessionFromCookie();

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get creatorId from session or request
      const creatorId = session.creatorId || extractCreatorId(req);

      if (!creatorId) {
        return NextResponse.json(
          { error: "Creator ID required" },
          { status: 400 }
        );
      }

      // Verify user has access to this creator
      const hasAccess = await checkTenantAccess(session.userId, creatorId);

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Forbidden: Invalid creator access" },
          { status: 403 }
        );
      }

      const { requireAuth } = await import("../auth/middleware");
      const auth = await requireAuth();

      return await handler(req, auth, { creatorId });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unauthorized" },
        { status: 401 }
      );
    }
  };
}

/**
 * Helper to add tenant filter to Prisma queries
 */
export function withTenantFilter<T extends { where?: Record<string, unknown> }>(
  query: T,
  creatorId: string
): T {
  return enforceTenantIsolation(query, creatorId);
}

/**
 * Middleware to extract creatorId from route params or body
 */
export function extractCreatorId(req: NextRequest): string | null {
  // Try to get from URL params (e.g., /api/creators/[id])
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const creatorIndex = pathSegments.indexOf("creators");
  if (creatorIndex !== -1 && pathSegments[creatorIndex + 1]) {
    return pathSegments[creatorIndex + 1];
  }

  // Try to get from query params
  const creatorIdParam = url.searchParams.get("creatorId");
  if (creatorIdParam) {
    return creatorIdParam;
  }

  return null;
}
