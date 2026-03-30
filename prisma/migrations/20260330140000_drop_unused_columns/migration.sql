-- TRA-88: Drop unused sessionId from AffiliateClick
ALTER TABLE "affiliate_clicks" DROP COLUMN IF EXISTS "session_id";

-- TRA-89: Drop unused address from HotelSelection
ALTER TABLE "hotel_selections" DROP COLUMN IF EXISTS "address";

-- TRA-90: Drop unused imageUrl from HotelSelection
ALTER TABLE "hotel_selections" DROP COLUMN IF EXISTS "image_url";
