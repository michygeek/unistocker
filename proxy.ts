import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(function proxy(request) {
  const { nextUrl, auth: session } = request as typeof request & {
    auth: { user?: { isSuperAdmin?: boolean } } | null;
  };
  const { pathname } = nextUrl;

  const isSuperAdmin = !!(session?.user as { isSuperAdmin?: boolean } | undefined)?.isSuperAdmin;

  // Auth pages: redirect logged-in users to the right home
  const authPaths = ["/auth/login", "/auth/register", "/auth/error", "/auth/forgot-password", "/auth/reset-password", "/auth/verify-email"];
  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (session?.user) {
      return Response.redirect(new URL(isSuperAdmin ? "/admin" : "/dashboard", request.url));
    }
    return;
  }

  // API auth routes: always allow
  if (pathname.startsWith("/api/auth")) return;

  // Paystack webhook + email verification: public
  if (pathname.startsWith("/api/paystack")) return;
  if (pathname.startsWith("/api/auth/verify-email")) return;

  // Landing + legal pages: publicly accessible
  if (pathname === "/" || pathname === "/privacy" || pathname === "/terms") return;

  // All other routes: require authentication
  if (!session?.user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  // Admin routes: require super admin
  if (pathname.startsWith("/admin")) {
    if (!isSuperAdmin) return Response.redirect(new URL("/dashboard", request.url));
    return;
  }

  // App routes: super admins should stay in /admin
  if (isSuperAdmin && !pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    return Response.redirect(new URL("/admin", request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*|.*\\.png|.*\\.svg|.*\\.ico).*)",
  ],
};
