-- Add updated_at to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Also ensure order_items has timestamps for consistency
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update existing orders to set updated_at if it's null
UPDATE public.orders SET updated_at = created_at WHERE updated_at IS NULL;
