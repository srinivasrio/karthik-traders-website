-- Migration: Add numeric order_number to orders
-- Path: supabase/migrations/20260131_numeric_order_id.sql

-- 1. Create a sequence for the 8-digit order number starting at 10000000
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 10000000;

-- 2. Add the column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number BIGINT UNIQUE;

-- 3. Populate existing rows
UPDATE public.orders SET order_number = nextval('order_number_seq') WHERE order_number IS NULL;

-- 4. Set default and not null
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq');
ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;
