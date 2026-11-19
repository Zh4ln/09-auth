import { NextRequest, NextResponse } from "next/server";
import { checkSession } from "@/lib/api/serverApi";

function getUpdatedCookies(headers: {
  [key: string]: unknown;
}): string[] {
  const header = headers["set-cookie"];
  if (Array.isArray(header)) {
    return header.filter((cookie): cookie is string => typeof cookie === "string");
  }
  return typeof header === "string" ? [header] : [];
}

// On a token refresh the next server-rendered page must see the new accessToken,
// and the browser must receive the original Set-Cookie headers as well.
function forwardSessionCookies(
  response: NextResponse,
  updatedCookies: string[],
): NextResponse {
  for (const cookie of updatedCookies) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

function refreshedRequestHeaders(
  request: NextRequest,
  updatedCookies: string[],
): Headers {
  const headers = new Headers(request.headers);
  if (updatedCookies.length === 0) return headers;

  const cookieValues = new Map<string, string>();
  for (const part of (headers.get("cookie") || "").split(";")) {
    const entry = part.trim();
    const index = entry.indexOf("=");
    if (index > 0) cookieValues.set(entry.slice(0, index), entry.slice(index + 1));
  }

  for (const setCookie of updatedCookies) {
    const firstPart = setCookie.split(";", 1)[0]?.trim() ?? "";
    const index = firstPart.indexOf("=");
    if (index <= 0) continue;
    const name = firstPart.slice(0, index);
    const value = firstPart.slice(index + 1);
    if (value) cookieValues.set(name, value);
    else cookieValues.delete(name);
  }
  headers.set(
    "cookie",
    Array.from(cookieValues, ([name, value]) => `${name}=${value}`).join("; "),
  );
  return headers;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPrivateRoute =
    pathname.startsWith("/notes") || pathname.startsWith("/profile");
  const isAuthRoute = pathname === "/sign-in" || pathname === "/sign-up";

  if (!isPrivateRoute && !isAuthRoute) return NextResponse.next();

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // No session cookies: guests can visit auth routes, but not private pages.
  if (!accessToken && !refreshToken) {
    return isPrivateRoute
      ? NextResponse.redirect(new URL("/sign-in", request.url))
      : NextResponse.next();
  }

  let isAuthenticated: boolean;
  let updatedCookies: string[] = [];

  try {
    // Also called when only refreshToken exists, so /auth/session can
    // return a new accessToken and refreshToken in Set-Cookie.
    const session = await checkSession(
      request.headers.get("cookie") ?? "",
      request.nextUrl.origin,
    );
    isAuthenticated = session.status >= 200 && session.status < 300;
    updatedCookies = getUpdatedCookies(session.headers);
  } catch {
    isAuthenticated = false;
  }

  if (!isAuthenticated && isPrivateRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Authenticated visitors must leave sign-in/sign-up for the HOME page.
  if (isAuthenticated && isAuthRoute) {
    return forwardSessionCookies(
      NextResponse.redirect(new URL("/", request.url)),
      updatedCookies,
    );
  }

  const requestHeaders = refreshedRequestHeaders(request, updatedCookies);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return forwardSessionCookies(response, updatedCookies);
}

export const config = {
  matcher: ["/notes/:path*", "/profile/:path*", "/sign-in", "/sign-up"],
};
