/**
 * Auth0 v4 Proxy (Next.js 16)
 * Automatically mounts authentication routes:
 * - /auth/login
 * - /auth/callback
 * - /auth/logout
 * - /auth/profile
 * - /auth/access-token
 * - /auth/backchannel-logout
 */

import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth/config";

export async function proxy(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
