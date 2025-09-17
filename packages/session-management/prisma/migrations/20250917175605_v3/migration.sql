/*
  Warnings:

  - You are about to drop the column `deposit_address` on the `orders` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."WalletStatus" AS ENUM ('available', 'allocated', 'disabled');

-- CreateEnum
CREATE TYPE "public"."QueuePriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- DropIndex
DROP INDEX "public"."orders_deposit_address_idx";

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "deposit_address",
ADD COLUMN     "wallet_id" UUID;

-- CreateTable
CREATE TABLE "public"."wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "address" VARCHAR(255) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "token_standard" VARCHAR(20),
    "status" "public"."WalletStatus" NOT NULL DEFAULT 'available',
    "label" VARCHAR(100),
    "notes" TEXT,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "disabled_at" TIMESTAMPTZ(6),

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_queue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "wallet_id" UUID,
    "currency" VARCHAR(10) NOT NULL,
    "priority" "public"."QueuePriority" NOT NULL DEFAULT 'normal',
    "queue_position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "wallet_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "public"."wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_currency_status_idx" ON "public"."wallets"("currency", "status");

-- CreateIndex
CREATE INDEX "wallets_status_idx" ON "public"."wallets"("status");

-- CreateIndex
CREATE INDEX "wallets_currency_idx" ON "public"."wallets"("currency");

-- CreateIndex
CREATE INDEX "wallets_last_used_at_idx" ON "public"."wallets"("last_used_at");

-- CreateIndex
CREATE INDEX "wallets_currency_status_last_used_at_idx" ON "public"."wallets"("currency", "status", "last_used_at");

-- CreateIndex
CREATE INDEX "wallets_created_at_idx" ON "public"."wallets"("created_at");

-- CreateIndex
CREATE INDEX "wallets_address_idx" ON "public"."wallets"("address");

-- CreateIndex
CREATE INDEX "wallet_queue_currency_priority_created_at_idx" ON "public"."wallet_queue"("currency", "priority", "created_at");

-- CreateIndex
CREATE INDEX "wallet_queue_processed_at_idx" ON "public"."wallet_queue"("processed_at");

-- CreateIndex
CREATE INDEX "wallet_queue_expires_at_idx" ON "public"."wallet_queue"("expires_at");

-- CreateIndex
CREATE INDEX "wallet_queue_order_id_idx" ON "public"."wallet_queue"("order_id");

-- CreateIndex
CREATE INDEX "wallet_queue_wallet_id_idx" ON "public"."wallet_queue"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_queue_created_at_idx" ON "public"."wallet_queue"("created_at");

-- CreateIndex
CREATE INDEX "wallet_queue_priority_created_at_idx" ON "public"."wallet_queue"("priority", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_queue_order_id_key" ON "public"."wallet_queue"("order_id");

-- CreateIndex
CREATE INDEX "orders_wallet_id_idx" ON "public"."orders"("wallet_id");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_queue" ADD CONSTRAINT "wallet_queue_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_queue" ADD CONSTRAINT "wallet_queue_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
