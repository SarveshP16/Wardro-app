import { NextResponse, type NextRequest } from "next/server";

/// Cross-site request guard for the API. Wardro has no login (access is
/// whoever is on your tailnet), so the one thing to stop is a web page
/// on some other site, opened on a device that's on the tailnet, firing
/// requests at Wardro in the background. Browsers label every request
/// with `Sec-Fetch-Site`; anything that changes data and didn't come
/// from Wardro's own pages is refused. Requests without the header
/// (curl, scripts) aren't browsers and pass through.
export function proxy(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return NextResponse.next();
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site" || fetchSite === "same-site") {
    return NextResponse.json(
      { error: "Cross-site requests aren't allowed." },
      { status: 403 },
    );
  }

  // Older browsers without Sec-Fetch-*: fall back to comparing Origin
  // with the host the request was addressed to.
  const origin = request.headers.get("origin");
  if (!fetchSite && origin) {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      // Malformed Origin -- treated as a mismatch below.
    }
    if (originHost !== host) {
      return NextResponse.json(
        { error: "Cross-site requests aren't allowed." },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
