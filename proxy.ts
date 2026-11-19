import { checkSession } from "@/lib/api/serverApi";
import { NextRequest, NextResponse } from "next/server";

function withDestination(
  request: NextRequest,
  destination: string,
): NextResponse {
  return NextResponse.redirect(new URL(destination, request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate =
    pathname.startsWith("/notes") || pathname.startsWith("/profile");
  const isAuth = pathname === "/sign-in" || pathname === "/sign-up";
  if (!isPrivate && !isAuth) return NextResponse.next();

  const cookie = request.headers.get("cookie");
  if (!cookie)
    return isPrivate
      ? withDestination(request, "/sign-in")
      : NextResponse.next();

  const user = await checkSession(cookie, request.nextUrl.origin);
  const isAuthenticated = user !== null;

  if (isPrivate && !isAuthenticated)
    return withDestination(request, "/sign-in");
  if (isAuth && isAuthenticated) return withDestination(request, "/profile");
  return NextResponse.next();
}

export const config = {
  matcher: ["/notes/:path*", "/profile/:path*", "/sign-in", "/sign-up"],
};
