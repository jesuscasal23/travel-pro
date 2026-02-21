/*
  Warnings:

  - You are about to drop the column `budget` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the `analytics_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `experiment_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `experiments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "experiment_assignments" DROP CONSTRAINT "experiment_assignments_experiment_id_fkey";

-- AlterTable
ALTER TABLE "trips" DROP COLUMN "budget";

-- DropTable
DROP TABLE "analytics_events";

-- DropTable
DROP TABLE "experiment_assignments";

-- DropTable
DROP TABLE "experiments";
