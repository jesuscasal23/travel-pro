-- AlterTable: add updated_at with default for existing rows
ALTER TABLE "trips" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now();

-- CreateIndex
CREATE INDEX "itineraries_trip_id_idx" ON "itineraries"("trip_id");

-- CreateIndex
CREATE INDEX "itinerary_edits_itinerary_id_idx" ON "itinerary_edits"("itinerary_id");

-- CreateIndex
CREATE INDEX "trips_profile_id_idx" ON "trips"("profile_id");
