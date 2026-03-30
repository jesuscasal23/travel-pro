-- Backfill existing null values
UPDATE "profiles" SET "activity_level" = 'moderate' WHERE "activity_level" IS NULL;

-- AlterTable: make non-nullable with default
ALTER TABLE "profiles" ALTER COLUMN "activity_level" SET NOT NULL;
ALTER TABLE "profiles" ALTER COLUMN "activity_level" SET DEFAULT 'moderate';
