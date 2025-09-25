/*
  Warnings:

  - A unique constraint covering the columns `[public_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `public_id` to the `orders` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add column as nullable first
ALTER TABLE "public"."orders" ADD COLUMN "public_id" VARCHAR(30);

-- Step 2: Generate public_id for existing orders using timestamp + random suffix
UPDATE "public"."orders" 
SET "public_id" = 'order_' || EXTRACT(epoch FROM created_at)::bigint * 1000 || '_' || substr(md5(random()::text), 1, 8)
WHERE "public_id" IS NULL;

-- Step 3: Make column NOT NULL
ALTER TABLE "public"."orders" ALTER COLUMN "public_id" SET NOT NULL;

-- Step 4: Create unique constraint
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_public_id_key" UNIQUE ("public_id");

-- Step 5: Create index for performance
CREATE INDEX "orders_public_id_idx" ON "public"."orders"("public_id");
