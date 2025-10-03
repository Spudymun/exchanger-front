/*
  Warnings:

  - You are about to drop the `wallet_queue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."wallet_queue" DROP CONSTRAINT "wallet_queue_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."wallet_queue" DROP CONSTRAINT "wallet_queue_wallet_id_fkey";

-- DropTable
DROP TABLE "public"."wallet_queue";

-- DropEnum
DROP TYPE "public"."QueuePriority";
