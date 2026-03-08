import crypto from "crypto";

const ALLOWED_REDIRECT_DOMAINS = [
  "skyscanner.net",
  "skyscanner.com",
  "booking.com",
  "getyourguide.com",
] as const;

export function isAllowedAffiliateDestination(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return ALLOWED_REDIRECT_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export function getAffiliateDestinationHostname(url: string): string {
  return new URL(url).hostname;
}

export function hashIpAddress(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
