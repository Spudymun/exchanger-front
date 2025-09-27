/*
  Warnings:

  - A unique constraint covering the columns `[telegram_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "telegram_id" VARCHAR(20);

-- CreateIndex
CREATE INDEX "idx_user_status_for_duplicate_check" ON "public"."orders"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "public"."users"("telegram_id");

-- CreateIndex
CREATE INDEX "users_telegram_id_idx" ON "public"."users"("telegram_id");
