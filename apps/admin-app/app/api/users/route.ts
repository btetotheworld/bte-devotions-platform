import { NextResponse } from "next/server";
import { withAuth } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// GET /api/users - List users (for admin/managers - scoped to creators they manage)
export const GET = withAuth(async (req, auth) => {
  const url = new URL(req.url);
  const creatorId = url.searchParams.get("creatorId");

  // If creatorId is specified, verify user can manage it
  if (creatorId) {
    const canManage = auth.session.managedCreatorIds?.includes(creatorId) || 
                      auth.session.creatorId === creatorId;

    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get users who can manage this creator
    const userRoles = await prisma.userRole.findMany({
      where: { creatorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
        role: true,
      },
    });

    return NextResponse.json({
      users: userRoles.map((ur) => ({
        id: ur.user.id,
        email: ur.user.email,
        name: ur.user.name,
        role: ur.role.name,
        createdAt: ur.user.createdAt,
      })),
    });
  }

  // If no creatorId, return current user's info
  if (!auth.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
      creatorId: auth.session.creatorId,
      roles: auth.user.roleNames || [],
    },
  });
});
