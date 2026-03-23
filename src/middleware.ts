import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** First route after login / when redirecting away from `/` (aligned with Login.tsx). */
function defaultHomePath(perms: string[]): string {
  if (perms.includes("admin:analytics")) return "/overview";
  if (perms.includes("admin:manage_plans")) return "/plans";
  if (perms.includes("audio:write")) return "/audio";
  if (perms.includes("branch:write")) return "/location";
  if (perms.includes("notifications:send")) return "/notifications";
  if (perms.includes("admin:manage_roles")) return "/roles";
  if (perms.includes("admin:invite")) return "/invites";
  if (perms.includes("user:read")) return "/users";
  return "/overview";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname === "/" || pathname === "") {
    if (token) {
      const perms = (token.permissions as string[]) ?? [];
      return NextResponse.redirect(
        new URL(defaultHomePath(perms), req.url)
      );
    }
    return NextResponse.next();
  }

  if (!token) {
    const signInUrl = new URL("/", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const perms = (token.permissions as string[]) ?? [];
  const has = (p: string) => perms.includes(p);

  if (pathname === "/audio-stats" || pathname.startsWith("/audio-stats/")) {
    return NextResponse.redirect(new URL("/overview", req.url));
  }

  const rules: [string, string][] = [
    ["/overview", "admin:analytics"],
    ["/notifications", "notifications:send"],
    ["/roles", "admin:manage_roles"],
    ["/invites", "admin:invite"],
    ["/audio", "audio:write"],
    ["/location", "branch:write"],
    ["/users", "user:read"],
  ];

  const fallback = defaultHomePath(perms);

  for (const [prefix, perm] of rules) {
    if (pathname.startsWith(prefix) && !has(perm)) {
      return NextResponse.redirect(new URL(fallback, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/overview",
    "/overview/:path*",
    "/plans",
    "/plans/:path*",
    "/location/:path*",
    "/audio/:path*",
    "/audio-stats",
    "/audio-stats/:path*",
    "/users/:path*",
    "/notifications/:path*",
    "/roles/:path*",
    "/invites/:path*",
  ],
};
