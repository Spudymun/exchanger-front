-- CreateTable
CREATE TABLE "public"."banks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "external_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "short_name" VARCHAR(50) NOT NULL,
    "logo_url" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_fiat_currencies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_id" UUID NOT NULL,
    "fiat_currency" VARCHAR(10) NOT NULL,
    "min_amount" DECIMAL(12,2) NOT NULL DEFAULT 100,
    "max_amount" DECIMAL(12,2) NOT NULL DEFAULT 100000,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_fiat_currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_reserves" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bank_id" UUID NOT NULL,
    "fiat_currency" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_reserves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banks_external_id_key" ON "public"."banks"("external_id");

-- CreateIndex
CREATE INDEX "banks_external_id_idx" ON "public"."banks"("external_id");

-- CreateIndex
CREATE INDEX "banks_is_active_is_default_idx" ON "public"."banks"("is_active", "is_default");

-- CreateIndex
CREATE INDEX "bank_fiat_currencies_fiat_currency_is_enabled_idx" ON "public"."bank_fiat_currencies"("fiat_currency", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "bank_fiat_currencies_bank_id_fiat_currency_key" ON "public"."bank_fiat_currencies"("bank_id", "fiat_currency");

-- CreateIndex
CREATE INDEX "bank_reserves_fiat_currency_amount_idx" ON "public"."bank_reserves"("fiat_currency", "amount");

-- CreateIndex
CREATE UNIQUE INDEX "bank_reserves_bank_id_fiat_currency_key" ON "public"."bank_reserves"("bank_id", "fiat_currency");

-- AddForeignKey
ALTER TABLE "public"."bank_fiat_currencies" ADD CONSTRAINT "bank_fiat_currencies_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_reserves" ADD CONSTRAINT "bank_reserves_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
