import type { User, Role } from "@prisma/client";

export interface Session {
  userId: string;
  churchId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface AuthContext {
  user: UserWithRoles;
  session: Session;
  churchId: string;
}

export interface GhostMember {
  id: string;
  email: string;
  name?: string;
  status: string;
  [key: string]: unknown;
}

