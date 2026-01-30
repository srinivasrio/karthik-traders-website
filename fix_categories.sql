-- Update Long Arm Gearboxes
UPDATE products 
SET category = 'long-arm' 
WHERE slug LIKE '%long-arm%';

-- Update Specific Long Arm Spares
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
