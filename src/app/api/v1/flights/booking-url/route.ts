// ============================================================
// Travel Pro — POST /api/v1/flights/booking-url
// Resolves a SerpApi booking_token into a real booking URL
// ============================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, parseAndValidateRequest } from "@/lib/api/helpers";
import { ApiError } from "@/lib/api/errors";
import { getOptionalSerpApiEnv } from "@/lib/config/server-env";
import { resolveBookingUrl, SerpApiRateLimitError } from "@/lib/flights/serpapi";

export const dynamic = "force-dynamic";

const BookingUrlInputSchema = z.object({
  bookingToken: z.string().min(1),
});

export const POST = apiHandler("POST /api/v1/flights/booking-url", async (req) => {
  const { bookingToken } = await parseAndValidateRequest(req, BookingUrlInputSchema);

  const serpApi = getOptionalSerpApiEnv();
  if (!serpApi) {
    throw new ApiError(503, "Flight booking resolution is not available");
  }

  try {
    const url = await resolveBookingUrl(serpApi.apiKey, bookingToken);

    if (!url) {
      return NextResponse.json({ bookingUrl: null }, { status: 200 });
    }

    return NextResponse.json({ bookingUrl: url });
  } catch (error) {
    if (error instanceof SerpApiRateLimitError) {
      throw new ApiError(429, error.message, { provider: "serpapi" }, "serpapi_rate_limit");
    }
    throw error;
  }
});
