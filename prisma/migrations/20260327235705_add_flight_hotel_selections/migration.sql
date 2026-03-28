-- CreateTable
CREATE TABLE "flight_selections" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "selection_type" TEXT NOT NULL,
    "from_iata" TEXT NOT NULL,
    "to_iata" TEXT NOT NULL,
    "departure_date" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" TEXT NOT NULL,
    "stops" INTEGER NOT NULL DEFAULT 0,
    "departure_time" TEXT,
    "arrival_time" TEXT,
    "cabin" TEXT NOT NULL DEFAULT 'ECONOMY',
    "booking_token" TEXT,
    "booking_url" TEXT NOT NULL,
    "booked" BOOLEAN NOT NULL DEFAULT false,
    "booked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_selections" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "selection_type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "check_in" TEXT NOT NULL,
    "check_out" TEXT NOT NULL,
    "hotel_name" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "price_per_night" DOUBLE PRECISION,
    "total_price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "address" TEXT,
    "image_url" TEXT,
    "booking_url" TEXT NOT NULL,
    "booked" BOOLEAN NOT NULL DEFAULT false,
    "booked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flight_selections_profile_id_idx" ON "flight_selections"("profile_id");

-- CreateIndex
CREATE INDEX "flight_selections_trip_id_idx" ON "flight_selections"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "flight_selections_trip_id_from_iata_to_iata_departure_date_key" ON "flight_selections"("trip_id", "from_iata", "to_iata", "departure_date");

-- CreateIndex
CREATE INDEX "hotel_selections_profile_id_idx" ON "hotel_selections"("profile_id");

-- CreateIndex
CREATE INDEX "hotel_selections_trip_id_idx" ON "hotel_selections"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_selections_trip_id_city_check_in_key" ON "hotel_selections"("trip_id", "city", "check_in");

-- AddForeignKey
ALTER TABLE "flight_selections" ADD CONSTRAINT "flight_selections_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_selections" ADD CONSTRAINT "flight_selections_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_selections" ADD CONSTRAINT "hotel_selections_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_selections" ADD CONSTRAINT "hotel_selections_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
