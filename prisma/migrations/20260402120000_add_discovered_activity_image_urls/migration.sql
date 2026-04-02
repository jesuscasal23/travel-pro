ALTER TABLE "discovered_activities"
ADD COLUMN "image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "discovered_activities"
SET "image_urls" = CASE
  WHEN "image_url" IS NOT NULL THEN ARRAY["image_url"]
  ELSE ARRAY[]::TEXT[]
END;
