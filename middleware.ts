import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string | undefined;
    const normalizedRole = role?.toLowerCase();

    console.log("Middleware checking: ", path);
    console.log("User role: ", role);

    const adminRoleRoutes: Record<string, string> = {
      owner: "/admin/owners",
      csr: "/admin/csr",
      cleaner: "/admin/cleaners",
      partner: "/admin/partners",
    };

    const adminRoles = Object.keys(adminRoleRoutes);

    // Admin area protection
    if (path.startsWith("/admin")) {
      // If accessing admin login page
      if (path === "/admin/login") {
        if (normalizedRole) {
          const correctRoute = adminRoleRoutes[normalizedRole];
          if (correctRoute) {
            console.log(`Already logged in, redirecting to ${correctRoute}`);
            return NextResponse.redirect(new URL(correctRoute, req.url));
          }
        }
        return NextResponse.next();
      }

      // If accessing other admin pages, must have admin role
      if (!normalizedRole || !adminRoles.includes(normalizedRole)) {
        console.log(`❌ No admin role detected, redirecting to admin login`);
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      // Role-based routing within admin area
      const correctRoute = adminRoleRoutes[normalizedRole];

      if (correctRoute && !path.startsWith(correctRoute)) {
        console.log(`Redirecting ${role} from ${path} to ${correctRoute}`);
        return NextResponse.redirect(new URL(correctRoute, req.url));
      }
    }

    // User area protection - redirect admins to their role-based page
    if (!path.startsWith("/admin")) {
      if (normalizedRole && adminRoles.includes(normalizedRole)) {
        const correctRoute = adminRoleRoutes[normalizedRole];
        console.log(
          `Admin trying to access user area, redirecting to ${correctRoute}`,
        );
        return NextResponse.redirect(new URL(correctRoute, req.url));
      }
    }

    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        if (path === "/admin/login") {
          return true;
        }

        // For admin routes, require token
        if (path.startsWith("/admin")) {
          console.log("Checking authorization, token exists:", !!token);
          return !!token;
        }

        // For non-admin routes, allow access
        return true;
      },
    },
    pages: {
      signIn: "/admin/login",
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/", "/rooms/:path*", "/bookings/:path*"],
};
