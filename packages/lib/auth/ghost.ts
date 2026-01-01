import type { GhostMember } from "../types/auth";

const GHOST_MEMBERS_API_URL = process.env.GHOST_MEMBERS_API_URL || "";
const GHOST_URL = process.env.GHOST_URL || "";

export interface GhostAuthResponse {
  member: GhostMember;
  token: string;
}

/**
 * Authenticate user with Ghost Members API
 */
export async function authenticateWithGhost(
  email: string,
  password: string
): Promise<GhostAuthResponse> {
  const response = await fetch(`${GHOST_MEMBERS_API_URL}/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Authentication failed" }));
    throw new Error(error.message || "Authentication failed");
  }

  const data = await response.json();
  return {
    member: data.member,
    token: data.token,
  };
}

/**
 * Get Ghost member by ID
 */
export async function getGhostMember(ghostMemberId: string): Promise<GhostMember | null> {
  try {
    const response = await fetch(`${GHOST_MEMBERS_API_URL}/members/${ghostMemberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.member || null;
  } catch (error) {
    console.error("Error fetching Ghost member:", error);
    return null;
  }
}

/**
 * Sync user from Ghost to our database
 */
export async function syncUserFromGhost(
  ghostMemberId: string,
  ghostMember?: GhostMember
): Promise<{ id: string; email: string; name?: string }> {
  // Import prisma from database package
  const { prisma } = await import("@bte-devotions/database");

  // Fetch member from Ghost if not provided
  const member = ghostMember || (await getGhostMember(ghostMemberId));
  if (!member) {
    throw new Error("Ghost member not found");
  }

  // Find or create user in our database
  let user = await prisma.user.findUnique({
    where: { ghostMemberId },
  });

  if (user) {
    // Update existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: member.email,
        name: member.name || undefined,
      },
    });
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: member.email,
        name: member.name || undefined,
        ghostMemberId: member.id,
        isCreator: false, // Default to false, can be updated later
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
  };
}
