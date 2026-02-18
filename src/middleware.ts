// ============================================================
// Travel Pro — Next.js Middleware
// Handles auth protection and rate limiting at the edge
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/plan", "/trip", "/profile"];

// Routes that are always public
const PUBLIC_PREFIXES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/privacy", "/share", "/api/health", "/auth/callback"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ── Rate limiting (Upstash Redis sliding window) ───────────────────────────
// Limits:
//   - /api/v1/trips/*/generate : 5 per hour per IP (LLM cost protection)
//   - /api/v1/* (general)      : 100 req/min authenticated, 30 req/min anon
//   - /api/v1/trips/shared/*   : 60 req/min per IP

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
    // Generation: 5 per hour per IP
    limitKey = `rl:generate:${ip}`;
    limit = 5;
    windowSeconds = 3600;
  } else if (pathname.startsWith("/api/v1/trips/shared/")) {
    // Public share views: 60 per minute
    limitKey = `rl:shared:${ip}`;
    limit = 60;
    windowSeconds = 60;
  } else if (pathname.startsWith("/api/v1/")) {
    // General API: 30/min unauthenticated (authenticated users get 100/min)
    limitKey = `rl:api:${ip}`;
    limit = 30;
    windowSeconds = 60;
  } else {
    return null;
  }

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

    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
    });

    if (!res.ok) return null;

    const results = await res.json() as { result: unknown }[];
    const count = results[2]?.result as number ?? 0;

    if (count > limit) {
      const retryAfter = windowSeconds;
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message:
            limitKey.startsWith("rl:generate:")
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
  } catch {
    // If Redis call fails, let the request through (fail open)
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public routes through without auth check
  if (PUBLIC_PREFIXES.some((p) => pathname === p || (p !== "/" && pathname.startsWith(p)))) {
    // Still apply rate limiting to public API routes
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
    return NextResponse.next();
  }

  // Apply rate limiting before auth check for API routes
  if (pathname.startsWith("/api/")) {
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
    return NextResponse.next();
  }

  // For protected routes, check Supabase session
  if (isProtected(pathname)) {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
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
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.next();
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
