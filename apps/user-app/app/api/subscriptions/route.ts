import { NextResponse } from "next/server";
import { withAuth } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// GET /api/subscriptions - Get user's subscriptions
export const GET = withAuth(async (req, auth) => {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: auth.user.id,
      isActive: true,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          slug: true,
          avatar: true,
          type: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ subscriptions });
});

// POST /api/subscriptions - Subscribe to a creator
export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { creatorId, contentType = "ALL" } = body;

    if (!creatorId) {
      return NextResponse.json({ error: "Creator ID is required" }, { status: 400 });
    }

    // Check if creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Check if already subscribed
    const existing = await prisma.subscription.findUnique({
      where: {
        userId_creatorId: {
          userId: auth.user.id,
          creatorId,
        },
      },
    });

    if (existing) {
      // Update existing subscription
      const subscription = await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          contentType,
        },
      });

      return NextResponse.json({ subscription });
    }

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: auth.user.id,
        creatorId,
        ghostMemberId: auth.user.ghostMemberId || "",
        contentType,
        isActive: true,
      },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to subscribe" },
      { status: 500 }
    );
  }
});

