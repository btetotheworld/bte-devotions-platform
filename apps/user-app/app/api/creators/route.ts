import { NextResponse } from "next/server";
import { withAuth, setupGhostAuthorForCreator, retryGhostApiCall } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// GET /api/creators - List creators (public or filtered)
export const GET = withAuth(async (req) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type"); // "INDIVIDUAL" | "CHURCH"
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const page = parseInt(url.searchParams.get("page") || "1");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
      { bio: { contains: search } },
    ];
  }

  if (type) {
    where.type = type;
  }

  const creators = await prisma.creator.findMany({
    where,
    include: {
      _count: {
        select: {
          subscriptions: {
            where: { isActive: true },
          },
        },
      },
    },
    take: limit,
    skip: (page - 1) * limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    creators,
    pagination: {
      page,
      limit,
      total: await prisma.creator.count({ where }),
    },
  });
});

// POST /api/creators - Become a creator
export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { name, slug, bio, type = "INDIVIDUAL" } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
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

    // Automatically create Ghost author and mapping
    try {
      await retryGhostApiCall(async () => {
        await setupGhostAuthorForCreator(
          creator.id,
          auth.user.id,
          creator.name,
          auth.user.email,
          creator.slug
        );
      });
    } catch (error) {
      console.error("Failed to create Ghost author for creator:", error);
      // Don't fail the creator creation if Ghost author creation fails
      // The author can be created later via the setup endpoint
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

