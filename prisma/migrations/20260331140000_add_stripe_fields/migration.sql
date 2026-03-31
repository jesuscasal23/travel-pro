-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "stripe_customer_id" TEXT,
ADD COLUMN "stripe_subscription_id" TEXT,
ADD COLUMN "stripe_price_id" TEXT,
ADD COLUMN "stripe_current_period_end" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_stripe_customer_id_key" ON "profiles"("stripe_customer_id");
