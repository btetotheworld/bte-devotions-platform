import { NextRequest, NextResponse } from "next/server";
import { withCreatorAccess, setupGhostAuthorForCreator, retryGhostApiCall } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// POST /api/creators/[id]/setup-ghost-author - Manually set up Ghost author for creator
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: creatorId } = await params;

  return withCreatorAccess(
    async () => creatorId,
    async (req, auth) => {
      try {
        // Get creator details
        const creator = await prisma.creator.findUnique({
          where: { id: creatorId },
          include: {
            user: true,
          },
        });

        if (!creator) {
          return NextResponse.json({ error: "Creator not found" }, { status: 404 });
        }

        if (!creator.user) {
          return NextResponse.json(
            { error: "Creator user not found" },
            { status: 404 }
          );
        }

        // Check if mapping already exists
        const existingMapping = await prisma.ghostAuthorMapping.findFirst({
          where: { creatorId },
        });

        if (existingMapping) {
          return NextResponse.json({
            message: "Ghost author mapping already exists",
            mapping: {
              id: existingMapping.id,
              ghostAuthorId: existingMapping.ghostAuthorId,
            },
          });
        }

        // Create Ghost author and mapping with retry
        const result = await retryGhostApiCall(async () => {
          return await setupGhostAuthorForCreator(
            creator.id,
            creator.user!.id,
            creator.name,
            creator.user!.email,
            creator.slug
          );
        });

        return NextResponse.json(
          {
            message: "Ghost author created and mapped successfully",
            ghostAuthorId: result.ghostAuthorId,
            mappingId: result.mappingId,
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("Error setting up Ghost author:", error);
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Failed to set up Ghost author",
          },
          { status: 500 }
        );
      }
    }
  )(req);
}


