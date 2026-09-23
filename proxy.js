import { NextResponse } from "next/server";

import { isRoleAllowedForPath } from "./lib/route-roles";


const AUTH_COOKIE_NAME = "svastha-auth";

// Public pages: reachable without login. Add new ones here (e.g. "/about").
const PUBLIC_PATHS = new Set(["/login", "/register"]);


const AUTH_PAGES = new Set(["/login"]);

const LOGIN_PATH = "/login";
const AUTHENTICATED_HOME_PATH = "/";

export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const rawCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(rawCookie);
 
  const role = rawCookie ? decodeURIComponent(rawCookie) : "";

  if (isAuthenticated && AUTH_PAGES.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = AUTHENTICATED_HOME_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Not logged in? Only the public pages are reachable.
  if (!isAuthenticated && !PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    // Preserve where the user was heading so login can send them back.
    if (pathname !== LOGIN_PATH) {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  // Logged in but the route is restricted to other roles -> bounce home.
  // NOTE: no console.log here — this runs on EVERY request, so logging the
  // (usually null = unrestricted) rule floods the dev server output.
  if (!isRoleAllowedForPath(pathname, { roleName: role })) {
    const url = request.nextUrl.clone();
    url.pathname = AUTHENTICATED_HOME_PATH;
    url.search = "";
    url.searchParams.set("denied", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip API routes, all `_next/*` framework internals (static chunks, image
    // optimization, the HMR websocket endpoint, dev-overlay fetches) and
    // browser probes like Chrome DevTools'
    // /.well-known/appspecific/com.chrome.devtools.json (which is not a page —
    // redirecting it to /login just adds noise to the logs).
    "/((?!api|_next|__nextjs|favicon.ico|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$).*)",
  ],
};