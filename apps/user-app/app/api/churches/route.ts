import { NextRequest, NextResponse } from "next/server";
import { withAuth, withRole, withTenantFilter } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// GET /api/churches - List churches (scoped to user's church)
export const GET = withAuth(async (req, auth) => {
  if (!auth.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Regular users can only see their own church
  const isAdmin = auth.user.roleNames?.includes("CHURCH_ADMIN");

  if (isAdmin) {
    // Admins can see all churches (for now, or filter by their church)
    const churches = await prisma.church.findMany({
      where: {
        id: auth.session.churchId, // Still filter to their church for multi-tenant safety
      },
      include: {
        _count: {
          select: {
            users: true,
            subscriptions: true,
          },
        },
      },
    });

    return NextResponse.json({ churches });
  }

  // Regular users get their church
  const church = await prisma.church.findUnique({
    where: { id: auth.session.churchId },
    include: {
      _count: {
        select: {
          users: true,
          subscriptions: true,
        },
      },
    },
  });

  return NextResponse.json({ churches: church ? [church] : [] });
});

// POST /api/churches - Create church (admin only)
export const POST = withRole("CHURCH_ADMIN", async (req, auth) => {
  try {
    const body = await req.json();
    const { name, slug, settings } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const church = await prisma.church.create({
      data: {
        name,
        slug,
        settings: settings ? JSON.stringify(settings) : null,
      },
    });

    return NextResponse.json({ church }, { status: 201 });
  } catch (error) {
    console.error("Error creating church:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create church",
      },
      { status: 500 }
    );
  }
});
