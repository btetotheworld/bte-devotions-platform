import type { Creator, User } from "@prisma/client";

export interface TenantContext {
  creator: Creator;
  user: User;
  creatorId: string;
  userId: string;
}

export interface CreatorContext {
  id: string;
  name: string;
  slug: string;
  type: string; // "INDIVIDUAL" | "CHURCH"
  bio?: string;
  avatar?: string;
  isVerified: boolean;
  settings?: Record<string, unknown>;
}
