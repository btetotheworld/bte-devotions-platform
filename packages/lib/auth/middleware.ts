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

  if (!auth.user) {
    throw new Error("User not found");
  }

  const hasRole = auth.user.roleNames?.includes(roleName);

  if (!hasRole) {
    throw new Error(`Forbidden: Role ${roleName} required`);
  }

  return auth;
}

/**
 * Require creator access - verify user is the creator or can manage the creator
 */
export async function requireCreatorAccess(creatorId: string): Promise<AuthContext> {
  const auth = await requireAuth();

  // Check if user is the creator
  const isCreator = auth.session.creatorId === creatorId;
  
  // Check if user can manage this creator
  const canManage = auth.session.managedCreatorIds?.includes(creatorId) || false;

  if (!isCreator && !canManage) {
    throw new Error("Forbidden: Access denied to this creator");
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
 * Middleware wrapper for API routes that require creator access
 */
export function withCreatorAccess(
  getCreatorId: (req: NextRequest) => string | Promise<string>,
  handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const creatorId = await getCreatorId(req);
      const auth = await requireCreatorAccess(creatorId);
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
