// ============================================================
// Travel Pro — POST /api/v1/flights/booking-url
// Legacy endpoint — kept for backwards compatibility.
// The new /api/v1/flights/book GET endpoint handles booking
// via browser-side form POST for proper airline session context.
// ============================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, parseAndValidateRequest } from "@/lib/api/helpers";
import { ApiError } from "@/lib/api/errors";
import { getOptionalSerpApiEnv } from "@/lib/config/server-env";
import { getBookingRequest, SerpApiRateLimitError } from "@/lib/flights/serpapi";

export const dynamic = "force-dynamic";

const BookingUrlInputSchema = z.object({
  bookingToken: z.string().min(1),
  departureId: z.string().min(2).max(10),
  arrivalId: z.string().min(2).max(10),
  outboundDate: z.string().min(8).max(12),
});

export const POST = apiHandler("POST /api/v1/flights/booking-url", async (req) => {
  const { bookingToken, departureId, arrivalId, outboundDate } = await parseAndValidateRequest(
    req,
    BookingUrlInputSchema
  );

  const serpApi = getOptionalSerpApiEnv();
  if (!serpApi) {
    throw new ApiError(503, "Flight booking resolution is not available");
  }

  try {
    const booking = await getBookingRequest(serpApi.apiKey, bookingToken, {
      departureId,
      arrivalId,
      outboundDate,
    });

    return NextResponse.json({ bookingUrl: booking?.url ?? null });
  } catch (error) {
    if (error instanceof SerpApiRateLimitError) {
      throw new ApiError(429, error.message, { provider: "serpapi" }, "serpapi_rate_limit");
    }
    throw error;
  }
});
