-- AlterTable
ALTER TABLE "discovered_activities" ADD COLUMN "venue_type" TEXT;
ALTER TABLE "discovered_activities" ADD COLUMN "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[];
