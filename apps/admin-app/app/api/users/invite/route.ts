import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// POST /api/users/invite - Invite creator (admin only)
export const POST = withRole("CHURCH_ADMIN", async (req, auth) => {
  try {
    const body = await req.json();
    const { email, roleName = "CREATOR" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json({ error: `Role ${roleName} not found` }, { status: 400 });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists, add role if not already assigned
      const existingRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId_churchId: {
            userId: user.id,
            roleId: role.id,
            churchId: auth.session.churchId,
          },
        },
      });

      if (!existingRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            churchId: auth.session.churchId,
          },
        });
      }

      return NextResponse.json({
        message: "User invited successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    // Create new user (they'll need to authenticate with Ghost first)
    // For now, we'll create a placeholder user
    user = await prisma.user.create({
      data: {
        email,
        churchId: auth.session.churchId,
      },
    });

    // Assign role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        churchId: auth.session.churchId,
      },
    });

    return NextResponse.json(
      {
        message: "User invited successfully. They need to sign up with Ghost Members API.",
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to invite user" },
      { status: 500 }
    );
  }
});

