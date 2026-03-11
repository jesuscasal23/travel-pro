-- DropForeignKey
ALTER TABLE "itinerary_edits" DROP CONSTRAINT "itinerary_edits_itinerary_id_fkey";

-- AlterTable
ALTER TABLE "itinerary_edits" ALTER COLUMN "itinerary_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "trips" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "itinerary_edits" ADD CONSTRAINT "itinerary_edits_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "itineraries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
