// ============================================================
// Travel Pro — GET /api/v1/flights/book
// Returns an auto-submitting HTML form that POSTs to Google's
// click-tracking endpoint in the user's browser, so the airline
// receives proper session context, cookies, and referrer.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getOptionalSerpApiEnv } from "@/lib/config/server-env";
import { getBookingRequest, SerpApiRateLimitError } from "@/lib/flights/serpapi";
import { createLogger } from "@/lib/core/logger";
import { prisma } from "@/lib/core/prisma";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";
import { hashIpAddress } from "@/lib/features/affiliate/redirect-utils";
import { getClientIp } from "@/lib/api/helpers";

export const dynamic = "force-dynamic";

const log = createLogger("flights-book");

function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function errorPage(message: string) {
  return htmlResponse(
    `<!DOCTYPE html>
<html><head><title>Booking</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b}
.card{max-width:400px;padding:2rem;border-radius:12px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.1);text-align:center}
h1{font-size:1.1rem;margin:0 0 .5rem}p{font-size:.9rem;color:#64748b;margin:0 0 1rem}
a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}</style></head>
<body><div class="card"><h1>Booking unavailable</h1><p>${message}</p>
<a href="javascript:window.close()">Close this tab</a></div></body></html>`,
    200
  );
}

function redirectForm(actionUrl: string, postData: string, bookWith: string) {
  // Parse post_data (URL-encoded) into hidden form fields
  const fields = postData
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      const eqIdx = pair.indexOf("=");
      const key = eqIdx >= 0 ? decodeURIComponent(pair.slice(0, eqIdx)) : decodeURIComponent(pair);
      const value = eqIdx >= 0 ? decodeURIComponent(pair.slice(eqIdx + 1)) : "";
      const safeKey = key.replace(/"/g, "&quot;");
      const safeValue = value.replace(/"/g, "&quot;");
      return `<input type="hidden" name="${safeKey}" value="${safeValue}">`;
    })
    .join("\n");

  return htmlResponse(
    `<!DOCTYPE html>
<html><head><title>Redirecting to ${bookWith}…</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b}
.card{text-align:center}.spinner{width:24px;height:24px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:spin .6s linear infinite;margin:0 auto 1rem}
@keyframes spin{to{transform:rotate(360deg)}}p{font-size:.9rem;color:#64748b}</style></head>
<body><div class="card"><div class="spinner"></div><p>Redirecting to ${bookWith}…</p></div>
<form id="f" method="POST" action="${actionUrl.replace(/"/g, "&quot;")}">
${fields}
</form>
<script>document.getElementById('f').submit();</script>
</body></html>`
  );
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const token = sp.get("token");
  const dep = sp.get("dep");
  const arr = sp.get("arr");
  const date = sp.get("date");
  const tripId = sp.get("tripId");

  if (!token || !dep || !arr || !date) {
    return errorPage("Missing required parameters.");
  }

  const serpApi = getOptionalSerpApiEnv();
  if (!serpApi) {
    return errorPage("Flight booking is not configured.");
  }

  try {
    const booking = await getBookingRequest(serpApi.apiKey, token, {
      departureId: dep,
      arrivalId: arr,
      outboundDate: date,
    });

    if (!booking) {
      log.warn("Could not get booking request", { dep, arr, date });
      return errorPage(
        "Could not resolve this flight's booking link. The flight may no longer be available."
      );
    }

    log.info("Serving booking redirect form", {
      bookWith: booking.bookWith,
      price: booking.price,
      dep,
      arr,
      date,
    });

    // Best-effort booking click tracking — never block the redirect
    try {
      const userId = await getAuthenticatedUserId();
      await prisma.affiliateClick.create({
        data: {
          provider: booking.bookWith.toLowerCase(),
          clickType: "flight",
          destination: new URL(booking.url).hostname,
          url: booking.url,
          tripId: tripId ?? null,
          userId: userId ?? null,
          ipHash: hashIpAddress(getClientIp(req)),
          metadata: {
            type: "flight",
            fromIata: dep,
            toIata: arr,
            departureDate: date,
            airline: booking.bookWith,
            price: booking.price,
          },
        },
      });
    } catch (trackError) {
      log.error("Failed to track flight booking click", {
        error: trackError instanceof Error ? trackError.message : String(trackError),
      });
    }

    return redirectForm(booking.url, booking.postData, booking.bookWith);
  } catch (error) {
    if (error instanceof SerpApiRateLimitError) {
      return errorPage("Flight booking is busy — please try again in a moment.");
    }
    throw error;
  }
}
