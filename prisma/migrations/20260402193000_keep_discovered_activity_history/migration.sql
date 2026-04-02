-- Alter trip_id to allow nulls so activities can persist after trip deletion
ALTER TABLE "public"."discovered_activities"
ALTER COLUMN "trip_id" DROP NOT NULL;

-- Recreate foreign key with ON DELETE SET NULL to keep history
ALTER TABLE "public"."discovered_activities"
DROP CONSTRAINT IF EXISTS "discovered_activities_trip_id_fkey";

ALTER TABLE "public"."discovered_activities"
ADD CONSTRAINT "discovered_activities_trip_id_fkey"
FOREIGN KEY ("trip_id")
REFERENCES "public"."trips" ("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
