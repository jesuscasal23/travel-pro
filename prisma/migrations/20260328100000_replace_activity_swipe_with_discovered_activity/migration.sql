-- DropTable
DROP TABLE "activity_swipes";

-- CreateTable
CREATE TABLE "discovered_activities" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "city_id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "google_maps_url" TEXT,
    "image_url" TEXT,
    "decision" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovered_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discovered_activities_trip_id_idx" ON "discovered_activities"("trip_id");

-- CreateIndex
CREATE INDEX "discovered_activities_trip_id_city_id_idx" ON "discovered_activities"("trip_id", "city_id");

-- CreateIndex
CREATE INDEX "discovered_activities_profile_id_idx" ON "discovered_activities"("profile_id");

-- AddForeignKey
ALTER TABLE "discovered_activities" ADD CONSTRAINT "discovered_activities_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovered_activities" ADD CONSTRAINT "discovered_activities_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
