/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `session_id` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ApplicationType" AS ENUM ('web', 'admin');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('pending', 'paid', 'processing', 'completed', 'cancelled', 'failed');

-- DropIndex
DROP INDEX "public"."users_role_idx";

-- DropIndex
DROP INDEX "public"."users_session_id_idx";

-- AlterTable
ALTER TABLE "public"."sessions" ADD COLUMN     "application_context" "public"."ApplicationType" NOT NULL DEFAULT 'web';

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "role",
DROP COLUMN "session_id";

-- CreateTable
CREATE TABLE "public"."user_app_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "application_context" "public"."ApplicationType" NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_app_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "crypto_amount" DECIMAL(36,18) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "uah_amount" DECIMAL(12,2) NOT NULL,
    "token_standard" VARCHAR(20),
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'pending',
    "deposit_address" VARCHAR(255) NOT NULL,
    "tx_hash" VARCHAR(255),
    "recipient_data" JSONB,
    "assigned_operator_id" UUID,
    "assigned_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "old_value" VARCHAR(100),
    "new_value" VARCHAR(100),
    "metadata" JSONB,
    "comment" TEXT,
    "performed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_app_roles_application_context_idx" ON "public"."user_app_roles"("application_context");

-- CreateIndex
CREATE INDEX "user_app_roles_role_idx" ON "public"."user_app_roles"("role");

-- CreateIndex
CREATE INDEX "user_app_roles_user_id_idx" ON "public"."user_app_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_roles_user_id_application_context_key" ON "public"."user_app_roles"("user_id", "application_context");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "public"."orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "public"."orders"("status");

-- CreateIndex
CREATE INDEX "orders_currency_idx" ON "public"."orders"("currency");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "public"."orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "public"."orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_deposit_address_idx" ON "public"."orders"("deposit_address");

-- CreateIndex
CREATE INDEX "orders_assigned_operator_id_idx" ON "public"."orders"("assigned_operator_id");

-- CreateIndex
CREATE INDEX "orders_tx_hash_idx" ON "public"."orders"("tx_hash");

-- CreateIndex
CREATE INDEX "order_audit_logs_order_id_idx" ON "public"."order_audit_logs"("order_id");

-- CreateIndex
CREATE INDEX "order_audit_logs_created_at_idx" ON "public"."order_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "order_audit_logs_action_idx" ON "public"."order_audit_logs"("action");

-- CreateIndex
CREATE INDEX "order_audit_logs_performed_by_idx" ON "public"."order_audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "order_audit_logs_order_id_created_at_idx" ON "public"."order_audit_logs"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "sessions_application_context_user_id_idx" ON "public"."sessions"("application_context", "user_id");

-- AddForeignKey
ALTER TABLE "public"."user_app_roles" ADD CONSTRAINT "user_app_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_assigned_operator_id_fkey" FOREIGN KEY ("assigned_operator_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_audit_logs" ADD CONSTRAINT "order_audit_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_audit_logs" ADD CONSTRAINT "order_audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
