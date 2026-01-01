import { NextResponse } from "next/server";
import { withCreatorAccess } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// GET /api/creators/[id] - Get creator by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const creator = await prisma.creator.findUnique({
      where: { id },
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

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    return NextResponse.json({ creator });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch creator" },
      { status: 500 }
    );
  }
}

// PATCH /api/creators/[id] - Update creator (creator or admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withCreatorAccess(
    async () => id,
    async (req) => {
      try {
        const body = await req.json();
        const { name, bio, avatar, settings } = body;

        const creator = await prisma.creator.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(bio !== undefined && { bio }),
            ...(avatar !== undefined && { avatar }),
            ...(settings && { settings: JSON.stringify(settings) }),
          },
        });

        return NextResponse.json({ creator });
      } catch (error) {
        console.error("Error updating creator:", error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to update creator" },
          { status: 500 }
        );
      }
    }
  )(req);
}

