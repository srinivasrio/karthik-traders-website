-- Migration: Add partial stock fulfillment support
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS fulfilled_quantity INTEGER;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS out_of_stock_reason TEXT;

-- Initialize existing rows
UPDATE public.order_items SET fulfilled_quantity = quantity WHERE fulfilled_quantity IS NULL;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS include_oos_in_invoice BOOLEAN DEFAULT false;

-- Drop and recreate status check constraint to support new statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
    'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'rejected', 
    'completed', 'partially_fulfilled', 'out_of_stock'
));
