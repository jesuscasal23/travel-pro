-- AlterTable
ALTER TABLE "affiliate_clicks" ADD COLUMN     "metadata" JSONB;

-- CreateIndex
CREATE INDEX "affiliate_clicks_user_id_idx" ON "affiliate_clicks"("user_id");
