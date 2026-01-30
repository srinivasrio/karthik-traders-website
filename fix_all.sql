-- 1. Fix the Constraint to allow 'long-arm'
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products ADD CONSTRAINT products_category_check CHECK (category IN ('aerators', 'spares', 'motors', 'gearboxes', 'long-arm'));

-- 2. Update Long Arm Gearboxes
UPDATE products 
SET category = 'long-arm' 
WHERE slug LIKE '%long-arm%';

-- 3. Update Specific Long Arm Spares
UPDATE products 
SET category = 'long-arm' 
WHERE name IN (
    'Standard L Float 5 KG',
    'Sea Boss L Float 5.5 KG',
    'Long Arm Box',
    'Long Arm Bush Stand',
    'Height Bit',
    'Heavy Molding Fan'
);
