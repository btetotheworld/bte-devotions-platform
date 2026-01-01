import { NextResponse } from "next/server";
import { deleteSessionCookie } from "@bte-devotions/lib";

export async function POST() {
  await deleteSessionCookie();
  return NextResponse.json({ message: "Logged out successfully" });
}

