// ============================================================
// Fichi — Hotel API Types
// ============================================================

// ── SerpApi Google Hotels Response Types ─────────────────────

export interface SerpApiHotelProperty {
  type: string;
  name: string;
  description?: string;
  link?: string;
  gps_coordinates?: { latitude: number; longitude: number };
  check_in_time?: string;
  check_out_time?: string;
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
    before_taxes_fees?: string;
    extracted_before_taxes_fees?: number;
  };
  total_rate?: {
    lowest?: string;
    extracted_lowest?: number;
    before_taxes_fees?: string;
    extracted_before_taxes_fees?: number;
  };
  nearby_places?: Array<{
    name: string;
    transportations?: Array<{ type: string; duration: string }>;
  }>;
  hotel_class?: number | string; // SerpApi returns e.g. "3-star tourist hotel" or a number
  overall_rating?: number; // e.g. 4.2
  reviews?: number; // review count
  amenities?: string[];
  images?: Array<{ thumbnail: string; original_image?: string }>;
  essential_info?: string[];
}

export interface SerpApiHotelsResponse {
  search_metadata: { status: string };
  search_parameters: Record<string, string>;
  properties?: SerpApiHotelProperty[];
  error?: string;
}

// ── Internal Types ──────────────────────────────────────────

/** Intermediate candidate used before AI ranking */
export interface HotelCandidate {
  hotelId: string;
  name: string;
  rating?: number;
  pricePerNight?: number;
  totalPrice?: number;
  currency: string;
  address?: string;
  distance?: string;
  overallRating?: number;
  reviewCount?: number;
  amenities?: string[];
  thumbnail?: string;
  link?: string;
  lat?: number;
  lng?: number;
}
