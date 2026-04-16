import { type NextRequest, NextResponse } from "next/server";

/**
 * Normalise any URL that contains consecutive slashes (e.g. /city//place/mens-bar).
 * These can arrive from old sitemap bugs and would otherwise cause a 500.
 * A 301 redirect to the collapsed path lets the destination page return a proper 404.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.includes("//")) {
    const cleanPath = pathname.replace(/\/\/+/g, "/");
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    url.search = search;
    return NextResponse.redirect(url, { status: 301 });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except Next.js internals and static files.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
