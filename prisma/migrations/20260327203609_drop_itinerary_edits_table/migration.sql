/*
  Warnings:

  - You are about to drop the `itinerary_edits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "itinerary_edits" DROP CONSTRAINT "itinerary_edits_itinerary_id_fkey";

-- DropTable
DROP TABLE "itinerary_edits";
