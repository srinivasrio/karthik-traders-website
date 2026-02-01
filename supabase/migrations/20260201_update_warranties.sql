-- Update specifications for Aqualion Motor
-- 1. Remove Warranty key
-- 2. Add/Update Certification to "ISO Certified"
UPDATE public.products
SET specifications = (specifications - 'Warranty') || '{"Certification": "ISO Certified"}'::jsonb
WHERE name ILIKE '%Aqualion%Motor%';

-- Update specifications for Sea Boss Motor
-- 1. Remove Warranty key
UPDATE public.products
SET specifications = specifications - 'Warranty'
WHERE name ILIKE '%Sea Boss%Motor%';

-- Update specifications for A2 Worm Gearbox (User typo: "warm gearboc")
UPDATE public.products
SET specifications = specifications - 'Warranty'
WHERE name ILIKE '%A2%Worm%Gearbox%' OR name ILIKE '%A2%Warm%';

-- Update specifications for PN A3 Gearbox
UPDATE public.products
SET specifications = specifications - 'Warranty'
WHERE name ILIKE '%PN%A3%Gearbox%';
