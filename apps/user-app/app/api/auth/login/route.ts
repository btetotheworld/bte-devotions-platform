import { NextRequest, NextResponse } from "next/server";
import { authenticateWithGhost, syncUserFromGhost } from "@bte-devotions/lib";
import { createSession, setSessionCookie } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Authenticate with Ghost Members API
    const { member } = await authenticateWithGhost(email, password);

    // Sync user to our database
    const user = await syncUserFromGhost(member.id, member);

    // Get user with roles and creator info
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        creator: true,
        roles: {
          include: {
            role: true,
            creator: true,
          },
        },
      },
    });

    const roleNames = userWithRoles?.roles.map((ur) => ur.role.name) || [];
    const creatorId = userWithRoles?.creator?.id;
    
    // Get managed creator IDs (creators this user can manage)
    const managedCreatorIds = userWithRoles?.roles
      .filter((ur) => ur.role.name === "CREATOR_ADMIN")
      .map((ur) => ur.creatorId) || [];

    // Create session
    const sessionToken = await createSession(
      user.id,
      user.email,
      roleNames,
      creatorId,
      managedCreatorIds
    );

    // Set session cookie
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        creatorId,
        roles: roleNames,
        managedCreatorIds,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 401 }
    );
  }
}
