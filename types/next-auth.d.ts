import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isSuperAdmin?: boolean;
      branchId?: string | null;
      organizationId?: string | null;
      organizationName?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    isSuperAdmin?: boolean;
    branchId?: string | null;
    organizationId?: string | null;
    organizationName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isSuperAdmin?: boolean;
    branchId?: string | null;
    organizationId?: string | null;
    organizationName?: string | null;
  }
}
