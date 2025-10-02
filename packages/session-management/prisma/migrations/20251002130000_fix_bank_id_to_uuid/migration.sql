-- Fix bankId architecture: change from VARCHAR(50) to UUID with proper foreign key
-- Migration: 20251002130000_fix_bank_id_to_uuid

-- Step 1: Create a temporary column for UUID bankId
ALTER TABLE "public"."orders" 
ADD COLUMN "bank_id_uuid" UUID;

-- Step 2: Update existing records to map string bankId to Bank.id
-- This maps externalId (string) to id (UUID) from banks table
UPDATE "public"."orders" 
SET "bank_id_uuid" = (
  SELECT b.id 
  FROM "public"."banks" b 
  WHERE b.external_id = "public"."orders".bank_id
)
WHERE "public"."orders".bank_id IS NOT NULL;

-- Step 3: Drop the old VARCHAR column
ALTER TABLE "public"."orders" DROP COLUMN "bank_id";

-- Step 4: Rename the new column to bank_id
ALTER TABLE "public"."orders" RENAME COLUMN "bank_id_uuid" TO "bank_id";

-- Step 5: Add foreign key constraint
ALTER TABLE "public"."orders" 
ADD CONSTRAINT "orders_bank_id_fkey" 
FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Create index for better performance
CREATE INDEX "orders_bank_id_idx" ON "public"."orders"("bank_id");