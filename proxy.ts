import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(function proxy(request) {
  const { nextUrl, auth: session } = request as typeof request & { auth: { user?: unknown } | null };
  const { pathname } = nextUrl;

  // Auth pages: redirect logged-in users to dashboard, let others through
  const authPaths = ["/auth/login", "/auth/register", "/auth/error", "/auth/forgot-password", "/auth/reset-password"];
  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (session?.user) return Response.redirect(new URL("/dashboard", request.url));
    return;
  }

  // API auth routes: always allow
  if (pathname.startsWith("/api/auth")) return;

  // Landing page: publicly accessible to everyone
  if (pathname === "/") return;

  // All other routes: require authentication
  if (!session?.user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*|.*\\.png|.*\\.svg|.*\\.ico).*)",
  ],
};
