import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("places-photo-proxy");

/**
 * GET /api/v1/places/photo?ref=PHOTO_NAME&w=400
 *
 * Proxies a Google Places photo so the API key never reaches the client.
 * Returns the image bytes with appropriate cache headers.
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  const width = request.nextUrl.searchParams.get("w") || "400";

  if (!ref) {
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return new NextResponse(null, { status: 503 });
  }

  try {
    const url = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${width}&key=${key}`;
    const response = await fetch(url, { next: { revalidate: 86400 } });

    if (!response.ok) {
      log.warn("Places photo fetch failed", { status: response.status, ref });
      return new NextResponse(null, { status: 502 });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (error) {
    log.warn("Places photo proxy error", { ref, error });
    return new NextResponse(null, { status: 502 });
  }
}
