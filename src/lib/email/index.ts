// ============================================================
// Travel Pro — Email Client (Resend)
// Lazy-initialized to avoid build-time crashes
// ============================================================

let _resend: import("resend").Resend | null = null;

export function getResend() {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — emails will not be sent");
    return null;
  }
  const { Resend } = require("resend") as typeof import("resend");
  _resend = new Resend(apiKey);
  return _resend;
}

export const FROM_ADDRESS = "hello@travelpro.app";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://travelpro.app";

/** Send a welcome email to a new user. */
export async function sendWelcomeEmail(to: string, name?: string) {
  const resend = getResend();
  if (!resend) return;

  const { render } = await import("@react-email/render");
  const { WelcomeEmail } = await import("./templates/welcome");

  const html = await render(WelcomeEmail({ userName: name, planUrl: `${APP_URL}/plan` }));

  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Welcome to Travel Pro — your first trip is waiting",
    html,
  });
}

/** Send an itinerary ready notification. */
export async function sendItineraryReadyEmail(
  to: string,
  opts: { name?: string; destination: string; cities: string[]; dates: string; budget: string; tripId: string }
) {
  const resend = getResend();
  if (!resend) return;

  const { render } = await import("@react-email/render");
  const { ItineraryReadyEmail } = await import("./templates/itinerary-ready");

  const html = await render(
    ItineraryReadyEmail({
      userName: opts.name,
      destination: opts.destination,
      cities: opts.cities,
      dates: opts.dates,
      budget: opts.budget,
      itineraryUrl: `${APP_URL}/trip/${opts.tripId}`,
    })
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your ${opts.destination} itinerary is ready ✈`,
    html,
  });
}
