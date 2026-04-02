-- Column may already exist in environments where it was hotfixed manually,
-- so guard the addition to keep the migration idempotent.
ALTER TABLE "discovered_activities"
ADD COLUMN IF NOT EXISTS "image_urls" TEXT[];

UPDATE "discovered_activities"
SET "image_urls" = CASE
  WHEN "image_url" IS NOT NULL THEN ARRAY["image_url"]
  ELSE ARRAY[]::TEXT[]
END;

-- Ensure constraint + default match the Prisma schema even
-- if the column already existed before this migration ran.
ALTER TABLE "discovered_activities"
ALTER COLUMN "image_urls" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "discovered_activities"
ALTER COLUMN "image_urls" SET NOT NULL;
