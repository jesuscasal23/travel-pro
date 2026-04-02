const EARTH_RADIUS_KM = 6_371;

/** Compute haversine distance in kilometers between two lat/lng pairs. */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Convert a distance in kilometers to minutes using an assumed average km/h speed. */
export function distanceKmToMinutes(distanceKm: number, averageSpeedKmh: number): number {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(averageSpeedKmh) || averageSpeedKmh <= 0) {
    return NaN;
  }
  return Math.round((distanceKm / averageSpeedKmh) * 60);
}
