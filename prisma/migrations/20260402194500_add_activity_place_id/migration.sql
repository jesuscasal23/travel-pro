ALTER TABLE "public"."discovered_activities"
ADD COLUMN "google_place_id" text;

CREATE UNIQUE INDEX IF NOT EXISTS "discovered_activities_trip_place_unique"
ON "public"."discovered_activities" ("trip_id", "google_place_id")
WHERE "google_place_id" IS NOT NULL;
