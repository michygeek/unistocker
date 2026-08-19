import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

// Edge-compatible auth config — NO Prisma adapter, NO bcrypt, NO Node.js modules.
// Used only in proxy.ts (edge runtime) for route protection.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const publicPaths = ["/auth/login", "/auth/register", "/auth/error", "/auth/forgot-password", "/auth/reset-password", "/auth/verify-email"];
      if (publicPaths.some((p) => pathname.startsWith(p))) return true;
      if (pathname.startsWith("/api/auth")) return true;
      if (pathname === "/" || pathname === "/privacy" || pathname === "/terms" || pathname.startsWith("/_next") || pathname.startsWith("/api/paystack")) return true;
      if (pathname.startsWith("/admin")) {
        return !!(auth?.user as { isSuperAdmin?: boolean } | undefined)?.isSuperAdmin;
      }
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.id = user.id as string;
        token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin ?? false;
        token.branchId = (user as { branchId?: string | null }).branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean | undefined;
        session.user.branchId = token.branchId as string | null | undefined;
      }
      return session;
    },
  },
};
