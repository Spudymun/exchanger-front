-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN "expires_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "orders_expires_at_idx" ON "public"."orders"("expires_at");

-- CreateIndex
CREATE INDEX "orders_status_expires_at_idx" ON "public"."orders"("status", "expires_at");
