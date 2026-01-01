import { NextRequest, NextResponse } from "next/server";
import { withCreatorAccess } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

// POST /api/creators/[id]/invite - Invite user to manage creator (creator or admin only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: creatorId } = await params;

  return withCreatorAccess(
    async () => creatorId,
    async (req) => {
      try {
        const body = await req.json();
        const { email, roleName = "CREATOR_ADMIN" } = body;

        if (!email) {
          return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Check if role exists
        const role = await prisma.role.findUnique({
          where: { name: roleName },
        });

        if (!role) {
          return NextResponse.json({ error: `Role ${roleName} not found` }, { status: 400 });
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, add role if not already assigned
          const existingRole = await prisma.userRole.findUnique({
            where: {
              userId_roleId_creatorId: {
                userId: user.id,
                roleId: role.id,
                creatorId,
              },
            },
          });

          if (!existingRole) {
            await prisma.userRole.create({
              data: {
                userId: user.id,
                roleId: role.id,
                creatorId,
              },
            });
          }

          return NextResponse.json({
            message: "User invited successfully",
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          });
        }

        // Create new user (they'll need to authenticate with Ghost first)
        user = await prisma.user.create({
          data: {
            email,
            isCreator: false,
          },
        });

        // Assign role
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            creatorId,
          },
        });

        return NextResponse.json(
          {
            message: "User invited successfully. They need to sign up with Ghost Members API.",
            user: {
              id: user.id,
              email: user.email,
            },
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("Error inviting user:", error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to invite user" },
          { status: 500 }
        );
      }
    }
  )(req);
}

