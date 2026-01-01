import { NextResponse } from "next/server";
import { withAuth } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// GET /api/creators - List creators (for admin/managers - scoped to creators they manage)
export const GET = withAuth(async (req, auth) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type");

  // If user is a creator, show their own creator profile
  if (auth.session.creatorId) {
    const creator = await prisma.creator.findUnique({
      where: { id: auth.session.creatorId },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ creators: creator ? [creator] : [] });
  }

  // If user can manage creators, show those
  if (auth.session.managedCreatorIds && auth.session.managedCreatorIds.length > 0) {
    const creators = await prisma.creator.findMany({
      where: {
        id: { in: auth.session.managedCreatorIds },
        ...(search && {
          OR: [
            { name: { contains: search } },
            { slug: { contains: search } },
          ],
        }),
        ...(type && { type }),
      },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ creators });
  }

  // Otherwise, return empty
  return NextResponse.json({ creators: [] });
});

// POST /api/creators - Become a creator
export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { name, slug, bio, type = "INDIVIDUAL" } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    if (!auth.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already a creator
    if (auth.user.creator) {
      return NextResponse.json({ error: "User is already a creator" }, { status: 400 });
    }

    // Check if slug is available
    const existingCreator = await prisma.creator.findUnique({
      where: { slug },
    });

    if (existingCreator) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 400 });
    }

    // Create creator
    const creator = await prisma.creator.create({
      data: {
        name,
        slug,
        bio,
        type,
        user: {
          connect: { id: auth.user.id },
        },
      },
    });

    // Update user to be a creator
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { isCreator: true },
    });

    // Assign CREATOR role
    const creatorRole = await prisma.role.findUnique({
      where: { name: "CREATOR" },
    });

    if (creatorRole) {
      await prisma.userRole.create({
        data: {
          userId: auth.user.id,
          roleId: creatorRole.id,
          creatorId: creator.id,
        },
      });
    }

    return NextResponse.json({ creator }, { status: 201 });
  } catch (error) {
    console.error("Error creating creator:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create creator" },
      { status: 500 }
    );
  }
});

