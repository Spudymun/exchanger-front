/*
  Warnings:

  - You are about to drop the column `token_standard` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "token_standard";
