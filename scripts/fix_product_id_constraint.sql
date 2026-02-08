-- Fix: Drop foreign key constraint first, then alter column type
-- This allows storing string IDs like "seaboss-pr14bss" in order_items

BEGIN;

-- 1. Drop the foreign key constraint that enforces UUID linkage to products
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_product_id_fkey";

-- 2. Change the product_id column type to TEXT
ALTER TABLE "order_items" ALTER COLUMN "product_id" TYPE TEXT;

COMMIT;
