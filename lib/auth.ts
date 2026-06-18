import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: { select: { id: true, name: true } } },
        });

        if (!user || !user.password || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          image: user.image,
          branchId: user.branchId,
          organizationId: user.organization?.id ?? null,
          organizationName: user.organization?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.id = user.id as string;
        token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin ?? false;
        token.branchId = (user as { branchId?: string | null }).branchId;
        token.organizationId = (user as { organizationId?: string | null }).organizationId;
        token.organizationName = (user as { organizationName?: string | null }).organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean | undefined;
        session.user.branchId = token.branchId as string | null | undefined;
        session.user.organizationId = token.organizationId as string | null | undefined;
        session.user.organizationName = token.organizationName as string | null | undefined;
      }
      return session;
    },
  },
});
