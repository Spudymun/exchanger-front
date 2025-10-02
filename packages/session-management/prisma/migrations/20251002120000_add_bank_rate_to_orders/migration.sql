-- Add bank_id and fixed_exchange_rate fields to orders table
-- Migration: 20251002120000_add_bank_rate_to_orders

-- Add bank_id field (nullable for backward compatibility)
ALTER TABLE "public"."orders" 
ADD COLUMN "bank_id" VARCHAR(50);

-- Add fixed_exchange_rate field (nullable for backward compatibility)  
ALTER TABLE "public"."orders"
ADD COLUMN "fixed_exchange_rate" DECIMAL(15,8);

-- Create index for bank_id for better query performance
CREATE INDEX "orders_bank_id_idx" ON "public"."orders"("bank_id");

-- No foreign key constraint - bank_id can be null for old orders
-- and we use externalId pattern (string), not UUID references