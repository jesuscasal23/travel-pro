DROP INDEX IF EXISTS "trips_share_token_key";

ALTER TABLE "trips"
DROP COLUMN IF EXISTS "share_token";
