import type { Church, User } from "@prisma/client";

export interface TenantContext {
  church: Church;
  user: User;
  churchId: string;
  userId: string;
}

export interface ChurchContext {
  id: string;
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
}

