import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// GET /api/churches/[id] - Get church by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { requireAuth, checkTenantAccess } = await import(
      "@bte-devotions/lib"
    );
    const auth = await requireAuth();
    await checkTenantAccess(auth.session.userId, id);

    const church = await prisma.church.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    return NextResponse.json({ church });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
