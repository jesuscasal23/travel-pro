// ============================================================
// Travel Pro — Next.js Proxy (formerly Middleware)
// Handles auth protection and rate limiting before requests
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication.
const PROTECTED_PREFIXES = ["/profile", "/admin", "/trips", "/home", "/bookings", "/discover"];

// Routes that are always public
const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/api/health",
  "/auth/callback",
  "/get-started",
  "/plan",
  "/trip/",
  "/share",
  "/premium",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ── Rate limiting (Upstash Redis sliding window) ───────────────────────────
// All API rate limiting is centralized here. Limits:
//   - /api/v1/trips/*/generate : 5 per hour per IP (LLM cost protection)
//   - /api/v1/trips/*/discover-activities : 5 per hour per IP (LLM cost protection)
//   - /api/generate/select-route: 10 per minute per IP (speculative route selection)
//   - /api/v1/* (general)      : 30 req/min per IP

async function checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Skip rate limiting if Redis isn't configured (dev without Redis)
  if (!url || !token) return null;

  const pathname = request.nextUrl.pathname;

  // Only rate-limit API routes
  if (!pathname.startsWith("/api/")) return null;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  let limitKey: string;
  let limit: number;
  let windowSeconds: number;

  if (pathname.match(/^\/api\/v1\/trips\/[^/]+\/generate$/)) {
    // V1 SSE generation: 5 per hour per IP (LLM cost protection)
    limitKey = `rl:generate:${ip}`;
    limit = 5;
    windowSeconds = 3600;
  } else if (pathname.match(/^\/api\/v1\/trips\/[^/]+\/discover-activities$/)) {
    // Discovery batches: 5 per hour per IP (LLM cost protection)
    limitKey = `rl:discover:${ip}`;
    limit = 5;
    windowSeconds = 3600;
  } else if (pathname === "/api/generate/select-route") {
    // Speculative route selection: 10 per minute per IP
    limitKey = `rl:route-select:${ip}`;
    limit = 10;
    windowSeconds = 60;
  } else if (pathname.match(/^\/api\/v1\/trips\/[^/]+\/flights$/)) {
    // On-demand flight search: 20 per minute per IP
    limitKey = `rl:flights:${ip}`;
    limit = 20;
    windowSeconds = 60;
  } else if (pathname.startsWith("/api/v1/")) {
    // General API: 30/min unauthenticated (authenticated users get 100/min)
    limitKey = `rl:api:${ip}`;
    limit = 30;
    windowSeconds = 60;
  } else {
    return null;
  }

  const isExpensiveGenerationRoute =
    limitKey.startsWith("rl:generate:") || limitKey.startsWith("rl:discover:");

  try {
    // Upstash Redis REST API — works at the edge without ioredis
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Use sorted set sliding window: ZADD + ZREMRANGEBYSCORE + ZCARD
    const pipeline = [
      ["ZADD", limitKey, String(now), `${now}-${Math.random()}`],
      ["ZREMRANGEBYSCORE", limitKey, "-inf", String(windowStart)],
      ["ZCARD", limitKey],
      ["EXPIRE", limitKey, String(windowSeconds * 2)],
    ];

    // Abort after 2s so a slow Redis can't starve the route handler
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const fetchStart = Date.now();
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const fetchMs = Date.now() - fetchStart;

    if (!res.ok) {
      console.error(
        `[rate-limit] Redis error: status=${res.status}, key=${limitKey}, latency=${fetchMs}ms, ` +
          `path=${pathname}, ip=${ip}, action=${isExpensiveGenerationRoute ? "fail-closed" : "fail-open"}`
      );
      // Fail closed for expensive LLM endpoints, open for others
      if (isExpensiveGenerationRoute) {
        return new NextResponse(
          JSON.stringify({
            error: "Service unavailable",
            message: "Rate limiter unavailable. Please try again shortly.",
          }),
          { status: 503, headers: { "Content-Type": "application/json", "Retry-After": "30" } }
        );
      }
      return null;
    }

    if (fetchMs > 500) {
      console.warn(
        `[rate-limit] Slow Redis: latency=${fetchMs}ms, key=${limitKey}, path=${pathname}`
      );
    }

    const results = (await res.json()) as { result: unknown }[];
    const count = (results[2]?.result as number) ?? 0;

    if (count > limit) {
      console.warn(
        `[rate-limit] Rate limit exceeded: key=${limitKey}, count=${count}/${limit}, ` +
          `window=${windowSeconds}s, path=${pathname}, ip=${ip}`
      );
      const retryAfter = windowSeconds;
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: isExpensiveGenerationRoute
            ? `You've reached the generation limit. Try again in ${Math.ceil(windowSeconds / 60)} minutes.`
            : "Too many requests. Please slow down.",
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  } catch (err) {
    const reason =
      err instanceof DOMException && err.name === "AbortError" ? "timeout (2s)" : String(err);
    console.error(
      `[rate-limit] Redis failure: reason=${reason}, key=${limitKey}, ` +
        `path=${pathname}, ip=${ip}, action=${isExpensiveGenerationRoute ? "fail-closed" : "fail-open"}`
    );
    // Fail closed for expensive LLM endpoints, open for others
    if (isExpensiveGenerationRoute) {
      return new NextResponse(
        JSON.stringify({
          error: "Service unavailable",
          message: "Rate limiter unavailable. Please try again shortly.",
        }),
        { status: 503, headers: { "Content-Type": "application/json", "Retry-After": "30" } }
      );
    }
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a correlation ID for request tracing across logs
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  /** Create a NextResponse.next() with the request ID forwarded to origin. */
  const next = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-request-id", requestId);
    return response;
  };

  // Let public routes through without auth check
  if (PUBLIC_PREFIXES.some((p) => pathname === p || (p !== "/" && pathname.startsWith(p)))) {
    // Still apply rate limiting to public API routes
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) {
      rateLimitResponse.headers.set("x-request-id", requestId);
      return rateLimitResponse;
    }
    return next();
  }

  // Apply rate limiting before auth check for API routes
  if (pathname.startsWith("/api/")) {
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) {
      rateLimitResponse.headers.set("x-request-id", requestId);
      return rateLimitResponse;
    }
    return next();
  }

  // For protected routes, check Supabase session
  // Skip auth if Supabase is not configured (local dev without Supabase)
  if (
    isProtected(pathname) &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    return next();
  }
  if (isProtected(pathname)) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set("x-request-id", requestId);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(loginUrl);
      redirect.headers.set("x-request-id", requestId);
      return redirect;
    }

    return response;
  }

  return next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
