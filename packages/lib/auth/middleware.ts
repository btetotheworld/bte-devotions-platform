import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie, getUserFromSession } from "./session";
import type { Session } from "../types/auth";

export interface AuthContext {
  session: Session;
  user: Awaited<ReturnType<typeof getUserFromSession>>;
}

/**
 * Require authentication - returns user and session or throws error
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await getSessionFromCookie();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromSession(session);

  if (!user) {
    throw new Error("User not found");
  }

  return { session, user };
}

/**
 * Require specific role
 */
export async function requireRole(roleName: string): Promise<AuthContext> {
  const auth = await requireAuth();

  const hasRole = auth.user.roleNames?.includes(roleName);

  if (!hasRole) {
    throw new Error(`Forbidden: Role ${roleName} required`);
  }

  return auth;
}

/**
 * Require church access - verify user belongs to the church
 */
export async function requireChurchAccess(churchId: string): Promise<AuthContext> {
  const auth = await requireAuth();

  // Check if user belongs to the church
  if (auth.session.churchId !== churchId) {
    throw new Error("Forbidden: Access denied to this church");
  }

  return auth;
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth(
  handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const auth = await requireAuth();
      return await handler(req, auth);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unauthorized" },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware wrapper for API routes that require a specific role
 */
export function withRole(
  roleName: string,
  handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const auth = await requireRole(roleName);
      return await handler(req, auth);
    } catch (error) {
      const status = error instanceof Error && error.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unauthorized" },
        { status }
      );
    }
  };
}

/**
 * Middleware wrapper for API routes that require church access
 */
export function withChurchAccess(
  getChurchId: (req: NextRequest) => string | Promise<string>,
  handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const churchId = await getChurchId(req);
      const auth = await requireChurchAccess(churchId);
      return await handler(req, auth);
    } catch (error) {
      const status = error instanceof Error && error.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unauthorized" },
        { status }
      );
    }
  };
}

