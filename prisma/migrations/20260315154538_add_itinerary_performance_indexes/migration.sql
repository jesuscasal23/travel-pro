-- CreateIndex
CREATE INDEX "itineraries_trip_id_is_active_idx" ON "itineraries"("trip_id", "is_active");

-- CreateIndex
CREATE INDEX "itineraries_generation_status_idx" ON "itineraries"("generation_status");
