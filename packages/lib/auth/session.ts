import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Session } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "bte-devotions-session";
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Create a JWT session for a user
 */
export async function createSession(userId: string, churchId: string, email: string, roles: string[]): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    userId,
    churchId,
    email,
    roles,
    iat: now,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_DURATION)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function getSession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Session;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

/**
 * Get session from cookie
 */
export async function getSessionFromCookie(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return getSession(token);
}

/**
 * Get user from session
 */
export async function getUserFromSession(session: Session | null) {
  if (!session) {
    return null;
  }

  const { prisma } = await import("@bte-devotions/database");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Extract role names
  const roles = user.roles.map((ur) => ur.role.name);

  return {
    ...user,
    roles: user.roles.map((ur) => ur.role),
    roleNames: roles,
  };
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

/**
 * Delete session cookie
 */
export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

