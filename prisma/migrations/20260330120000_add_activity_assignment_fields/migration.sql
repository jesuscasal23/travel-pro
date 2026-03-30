-- AlterTable
ALTER TABLE "discovered_activities" ADD COLUMN "assigned_day" INTEGER;
ALTER TABLE "discovered_activities" ADD COLUMN "assigned_order" INTEGER;
ALTER TABLE "discovered_activities" ADD COLUMN "venue_type" TEXT;
ALTER TABLE "discovered_activities" ADD COLUMN "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropColumn (schema drift: build_job_id was removed from schema but not migrated)
ALTER TABLE "itineraries" DROP COLUMN IF EXISTS "build_job_id";

-- CreateIndex
CREATE INDEX "discovered_activities_trip_id_assigned_day_idx" ON "discovered_activities"("trip_id", "assigned_day");
