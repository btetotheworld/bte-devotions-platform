import type { User, Role } from "@prisma/client";

export interface Session {
  userId: string;
  email: string;
  creatorId?: string; // Optional - only if user is a creator
  roles: string[]; // ["CREATOR", "CREATOR_ADMIN", "SUBSCRIBER"]
  managedCreatorIds?: string[]; // Creators this user can manage (from UserRole)
  iat: number;
  exp: number;
}

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface AuthContext {
  user: UserWithRoles;
  session: Session;
  creatorId?: string; // If user is a creator
}

export interface GhostMember {
  id: string;
  email: string;
  name?: string;
  status: string;
  [key: string]: unknown;
}
