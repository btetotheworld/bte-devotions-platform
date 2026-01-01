import { NextResponse } from "next/server";
import { withAuth } from "@bte-devotions/lib";

export const GET = withAuth(async (req, auth) => {
  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
      churchId: auth.session.churchId,
      roles: auth.user.roleNames || [],
    },
  });
});

