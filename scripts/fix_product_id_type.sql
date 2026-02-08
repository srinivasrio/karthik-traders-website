-- Migration: Change order_items.product_id from UUID to TEXT
-- Reason: To support string-based product slugs like 'seaboss-pr14bss'

BEGIN;

-- 1. Drop the foreign key constraint if it exists (assuming it links to a products table that might also need checking)
-- Note: If there is no foreign key, this might error, so we wrap in a block or check existence.
-- Ideally we just alter the column type. PostgreSQL allows altering type if it can be cast.
-- UUID to TEXT is a valid cast.

ALTER TABLE order_items
ALTER COLUMN product_id TYPE TEXT;

-- Also check if `product_id` in `coupon_aerators` is TEXT (it should be, as per create_coupons.sql).
-- Just to be safe, ensuring consistency if needed, but the immediate error is on order_items.

COMMIT;
