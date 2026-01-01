import { NextRequest, NextResponse } from "next/server";
import { authenticateWithGhost, syncUserFromGhost } from "@bte-devotions/lib";
import { createSession, setSessionCookie } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, churchId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate with Ghost Members API
    const { member, token: ghostToken } = await authenticateWithGhost(
      email,
      password
    );

    // If churchId is provided, use it; otherwise, try to find user's existing church
    let userChurchId = churchId;

    if (!userChurchId) {
      const existingUser = await prisma.user.findUnique({
        where: { ghostMemberId: member.id },
        select: { churchId: true },
      });
      userChurchId = existingUser?.churchId;
    }

    if (!userChurchId) {
      return NextResponse.json(
        { error: "Church ID is required for new users" },
        { status: 400 }
      );
    }

    // Sync user to our database
    const user = await syncUserFromGhost(member.id, userChurchId, member);

    // Get user roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const roleNames =
      userWithRoles?.roles.map(
        (ur: { role: { name: string } }) => ur.role.name
      ) || [];

    // Create session
    const sessionToken = await createSession(
      user.id,
      userChurchId,
      user.email,
      roleNames
    );

    // Set session cookie
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        churchId: userChurchId,
        roles: roleNames,
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
