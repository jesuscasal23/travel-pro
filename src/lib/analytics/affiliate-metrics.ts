const COMMISSION_RATES: Record<string, number> = {
  skyscanner: 0.012, // ~1.2% of booking value
  booking: 0.04, // Booking.com average 4%
  getyourguide: 0.08, // Activities often ~8%
};

function extractPrice(metadata?: Record<string, unknown> | null): number | null {
  if (!metadata) return null;
  const priceLike =
    (metadata as Record<string, unknown>).price ?? metadata.total ?? metadata.amount;
  if (typeof priceLike === "number") return priceLike;
  if (typeof priceLike === "string") {
    const parsed = Number(priceLike);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function estimateAffiliateCommission(
  provider: string,
  metadata?: Record<string, unknown> | null
): number | null {
  const rate = COMMISSION_RATES[provider.toLowerCase()] ?? null;
  if (!rate) return null;
  const price = extractPrice(metadata ?? null);
  if (price == null) return null;
  return Number((price * rate).toFixed(2));
}
