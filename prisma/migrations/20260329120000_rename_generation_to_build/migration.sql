-- Rename "generation" columns to "build" (reflects deterministic assembly, not AI generation)
ALTER TABLE "itineraries" RENAME COLUMN "generation_status" TO "build_status";
ALTER TABLE "itineraries" RENAME COLUMN "generation_job_id" TO "build_job_id";

-- Update enum values: "generating" → "building"
UPDATE "itineraries" SET "build_status" = 'building' WHERE "build_status" = 'generating';

-- Recreate index with new column name
DROP INDEX IF EXISTS "itineraries_generation_status_idx";
CREATE INDEX "itineraries_build_status_idx" ON "itineraries"("build_status");
