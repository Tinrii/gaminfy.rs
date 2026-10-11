import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES } from "@/i18n/config";

// Optimistic redirect to sign-in only. Real authorization (ownership, admin role)
// is enforced again on the server in pages, actions and route handlers.
const isProtectedRoute = createRouteMatcher([
  "/profile(.*)",
  "/orders(.*)",
  "/admin(.*)",
  ...LOCALES.map((l) => `/${l}/(profile|orders)(.*)`),
]);

// Not localized: the admin panel, API routes, Clerk's internal endpoints and
// root-level metadata files (robots.txt, sitemap.xml, llms.txt, manifest).
const isUnlocalized = (pathname: string) =>
  /^\/(admin|api|__clerk)(\/|$)/.test(pathname) ||
  /^\/(robots\.txt|sitemap\.xml|llms\.txt|manifest\.webmanifest)$/.test(pathname);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();

  const { pathname, search } = req.nextUrl;
  if (isUnlocalized(pathname)) return;

  const first = pathname.split("/")[1];

  // /sr/... is the same as the bare path — keep one canonical URL. Generated share images
  // are referenced with the /sr/ prefix by Next.js itself, so those are served as-is.
  if (first === DEFAULT_LOCALE && !pathname.includes("/opengraph-image")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url);
  }

  // /en/... is served as-is by the [lang] segment.
  if (isLocale(first)) return;

  // Bare path: honour a saved language preference, otherwise serve Serbian.
  const saved = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved) && saved !== DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = `/${saved}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
