import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";
import { withTenantFilter } from "@bte-devotions/lib/middleware";

// GET /api/users - List users (scoped to church)
export const GET = withAuth(async (req, auth) => {
  const users = await prisma.user.findMany({
    where: {
      churchId: auth.session.churchId,
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((ur) => ur.role.name),
      createdAt: user.createdAt,
    })),
  });
});

