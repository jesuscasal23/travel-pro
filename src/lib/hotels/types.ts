// ============================================================
// Travel Pro — Amadeus Hotel API Response Types
// ============================================================

/** Single hotel entry from Hotel List API (GET /v1/reference-data/locations/hotels/by-city) */
export interface AmadeusHotelEntry {
  chainCode?: string;
  iataCode: string;
  dupeId?: number;
  name: string;
  hotelId: string;
  geoCode: { latitude: number; longitude: number };
  address?: { countryCode?: string };
  distance?: { value: number; unit: string };
  rating?: number; // star rating (1-5), only present for rated hotels
}

/** Price info from Hotel Offers API */
export interface AmadeusHotelPrice {
  currency: string;
  total: string;
  base?: string;
}

/** Single offer within a hotel from Hotel Offers API */
export interface AmadeusOffer {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  room?: { description?: { text?: string } };
  price: AmadeusHotelPrice;
}

/** Hotel with offers from Hotel Offers API (GET /v3/shopping/hotel-offers) */
export interface AmadeusHotelOffer {
  type: string;
  hotel: {
    hotelId: string;
    name: string;
    cityCode?: string;
    rating?: number;
    address?: { lines?: string[] };
  };
  available: boolean;
  offers: AmadeusOffer[];
}

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
}
