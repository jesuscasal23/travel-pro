-- AlterTable (idempotent — columns may already exist from prior migration)
ALTER TABLE "discovered_activities" ADD COLUMN IF NOT EXISTS "venue_type" TEXT;
ALTER TABLE "discovered_activities" ADD COLUMN IF NOT EXISTS "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[];
