import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "../auth/session";
import { enforceTenantIsolation, checkTenantAccess } from "./context";
import type { AuthContext } from "../auth/middleware";

/**
 * Middleware wrapper that automatically injects churchId from session
 * and enforces tenant isolation
 */
export function withTenant<T extends { where?: Record<string, unknown> }>(
  handler: (
    req: NextRequest,
    auth: AuthContext,
    tenantContext: { churchId: string }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const session = await getSessionFromCookie();

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify user has access to their church
      const hasAccess = await checkTenantAccess(session.userId, session.churchId);

      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden: Invalid church access" }, { status: 403 });
      }

      const { requireAuth } = await import("../auth/middleware");
      const auth = await requireAuth();

      return await handler(req, auth, { churchId: session.churchId });
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
  churchId: string
): T {
  return enforceTenantIsolation(query, churchId);
}

/**
 * Middleware to extract churchId from route params or body
 */
export function extractChurchId(req: NextRequest): string | null {
  // Try to get from URL params (e.g., /api/churches/[id])
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const churchIndex = pathSegments.indexOf("churches");
  if (churchIndex !== -1 && pathSegments[churchIndex + 1]) {
    return pathSegments[churchIndex + 1];
  }

  // Try to get from query params
  const churchIdParam = url.searchParams.get("churchId");
  if (churchIdParam) {
    return churchIdParam;
  }

  return null;
}

