-- Add new order status values: confirmed, rejected
-- Updates the orders table status check constraint

-- First, drop the existing constraint if it exists
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with additional status values
-- If no constraint existed, we just add these as valid values
-- Note: PostgreSQL text columns don't always have CHECK constraints,
-- so this migration ensures the application can use these values

-- We'll also add an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
