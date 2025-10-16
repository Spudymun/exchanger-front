-- CreateTable
CREATE TABLE "public"."manual_exchange_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency" TEXT NOT NULL,
    "uah_rate" DECIMAL(18,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_until" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "manual_exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manual_exchange_rates_currency_idx" ON "public"."manual_exchange_rates"("currency");

-- CreateIndex
CREATE INDEX "manual_exchange_rates_is_active_idx" ON "public"."manual_exchange_rates"("is_active");

-- CreateIndex
CREATE INDEX "manual_exchange_rates_valid_until_idx" ON "public"."manual_exchange_rates"("valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "manual_exchange_rates_currency_is_active_key" ON "public"."manual_exchange_rates"("currency", "is_active");
