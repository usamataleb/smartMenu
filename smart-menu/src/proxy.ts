import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const role = token?.role as string | undefined;

    // Restaurant owners must never reach superadmin routes — redirect to their panel
    if (pathname.startsWith("/superadmin")) {
      if (role !== "superadmin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/admin/login" },
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/superadmin/:path*", "/onboarding/:path*", "/onboarding"],
};
