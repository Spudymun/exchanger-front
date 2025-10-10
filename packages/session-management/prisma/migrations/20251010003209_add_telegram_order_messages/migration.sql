-- CreateTable
CREATE TABLE "public"."telegram_order_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "chat_id" TEXT NOT NULL,
    "message_id" BIGINT NOT NULL,
    "topic_id" INTEGER,
    "notification_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "telegram_order_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telegram_order_messages_order_id_idx" ON "public"."telegram_order_messages"("order_id");

-- CreateIndex
CREATE INDEX "idx_telegram_chat_message" ON "public"."telegram_order_messages"("chat_id", "message_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_order_messages_order_id_notification_type_key" ON "public"."telegram_order_messages"("order_id", "notification_type");

-- AddForeignKey
ALTER TABLE "public"."telegram_order_messages" ADD CONSTRAINT "telegram_order_messages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
