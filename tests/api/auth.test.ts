/**
 * IMPORTANT: These tests use Vitest, not Bun's test runner
 * 
 * ❌ Don't run: bun test (Bun's test runner doesn't support vi.mock)
 * ✅ Do run: bunx vitest run or bun run test:watch
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../setup";

// Mock the lib functions
vi.mock("@bte-devotions/lib", async () => {
  const actual = await vi.importActual("@bte-devotions/lib");
  return {
    ...actual,
    authenticateWithGhost: vi.fn(),
    syncUserFromGhost: vi.fn(),
    createSession: vi.fn(),
    setSessionCookie: vi.fn(),
    getSessionFromCookie: vi.fn(),
    getUserFromSession: vi.fn(),
    withAuth: vi.fn((handler) => {
      return async (req: NextRequest) => {
        const { getSessionFromCookie, getUserFromSession } = await import("@bte-devotions/lib");
        const session = await getSessionFromCookie();
        const user = await getUserFromSession(session!);
        if (!user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        return handler(req, { session: session!, user });
      };
    }),
  };
});

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

describe("Auth API", () => {
  let testUser: { id: string; email: string; name: string | null };

  beforeEach(async () => {
    // Clean up and create test user
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});

    // Create test role
    await prisma.role.create({
      data: {
        name: "SUBSCRIBER",
        description: "Test subscriber role",
      },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        isCreator: false,
      },
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const { authenticateWithGhost, syncUserFromGhost, createSession, setSessionCookie } =
        await import("@bte-devotions/lib");
      const { POST: login } = await import("../../apps/user-app/app/api/auth/login/route");

      // Mock Ghost authentication
      vi.mocked(authenticateWithGhost).mockResolvedValue({
        member: {
          id: "ghost-member-123",
          email: testUser.email,
          name: testUser.name || "Test User",
        },
      });

      // Mock user sync
      vi.mocked(syncUserFromGhost).mockResolvedValue(testUser);

      // Mock session creation
      vi.mocked(createSession).mockResolvedValue("session-token-123");
      vi.mocked(setSessionCookie).mockResolvedValue();

      const req = new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: testUser.email,
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await login(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.email);
      expect(authenticateWithGhost).toHaveBeenCalledWith(testUser.email, "password123");
    });

    it("should return error if email or password is missing", async () => {
      const { POST: login } = await import("../../apps/user-app/app/api/auth/login/route");

      const req = new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: testUser.email }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await login(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Email and password are required");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user when authenticated", async () => {
      const { getSessionFromCookie, getUserFromSession } = await import("@bte-devotions/lib");
      const { GET: me } = await import("../../apps/user-app/app/api/auth/me/route");

      // Mock session
      vi.mocked(getSessionFromCookie).mockResolvedValue({
        userId: testUser.id,
        email: testUser.email,
        roles: ["SUBSCRIBER"],
        creatorId: undefined,
        managedCreatorIds: [],
      });

      // Mock user
      vi.mocked(getUserFromSession).mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        roleNames: ["SUBSCRIBER"],
        creatorId: undefined,
        managedCreatorIds: [],
      });

      const req = new NextRequest("http://localhost/api/auth/me", {
        method: "GET",
      });

      const response = await me(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.email);
    });
  });
});

