-- AlterTable
ALTER TABLE "itineraries"
ADD COLUMN "discovery_status" TEXT NOT NULL DEFAULT 'pending';

-- Backfill existing complete itineraries so legacy trips keep the current itinerary UI.
UPDATE "itineraries"
SET "discovery_status" = 'completed'
WHERE "generation_status" = 'complete';

-- CreateTable
CREATE TABLE "activity_swipes" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "activity_name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "activity_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_swipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_swipes_trip_id_idx" ON "activity_swipes"("trip_id");

-- CreateIndex
CREATE INDEX "activity_swipes_profile_id_idx" ON "activity_swipes"("profile_id");

-- CreateIndex
CREATE INDEX "activity_swipes_created_at_idx" ON "activity_swipes"("created_at");

-- AddForeignKey
ALTER TABLE "activity_swipes"
ADD CONSTRAINT "activity_swipes_trip_id_fkey"
FOREIGN KEY ("trip_id") REFERENCES "trips"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_swipes"
ADD CONSTRAINT "activity_swipes_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "profiles"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
