-- CreateTable
CREATE TABLE "discovered_cities" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "times_proposed" INTEGER NOT NULL DEFAULT 1,
    "first_trip_id" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovered_cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discovered_cities_approved_idx" ON "discovered_cities"("approved");

-- CreateIndex
CREATE UNIQUE INDEX "discovered_cities_city_country_code_key" ON "discovered_cities"("city", "country_code");
