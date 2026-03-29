-- Add place_name column for accurate Google Places image lookups
ALTER TABLE "discovered_activities" ADD COLUMN "place_name" TEXT;
