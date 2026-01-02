import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// DELETE /api/subscriptions/[creatorId] - Unsubscribe from creator
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const { creatorId } = await params;

      const subscription = await prisma.subscription.findUnique({
        where: {
          userId_creatorId: {
            userId: auth.user.id,
            creatorId,
          },
        },
      });

      if (!subscription) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }

      // Deactivate subscription (soft delete)
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { isActive: false },
      });

      return NextResponse.json({ message: "Unsubscribed successfully" });
    } catch (error) {
      console.error("Error unsubscribing:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to unsubscribe" },
        { status: 500 }
      );
    }
  })(req);
}

