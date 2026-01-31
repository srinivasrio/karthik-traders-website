-- Add 'long-arm' as a valid category in products table
-- This allows long arm products to be properly categorized

ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE public.products 
ADD CONSTRAINT products_category_check 
CHECK (category IN ('aerators', 'spares', 'motors', 'gearboxes', 'long-arm'));
