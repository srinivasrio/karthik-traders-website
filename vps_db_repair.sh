#!/bin/bash
# vps_db_repair.sh
# This script repairs the Supabase PostgreSQL schema on the self-hosted VPS.

echo "--- Karthik Traders DB Repair Tool ---"

# Find container name
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep "db" | grep "supabase" | head -n 1)

if [ -z "$DB_CONTAINER" ]; then
    DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep "postgres" | head -n 1)
fi

if [ -z "$DB_CONTAINER" ]; then
  echo "Error: Could not find Supabase/Postgres container."
  exit 1
fi

echo "Targeting Container: $DB_CONTAINER"

# SQL to apply
REPAIR_SQL="
-- 1. Orders table updates
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_mobile text,
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS created_by_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Order Number Support
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 100001;
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number bigint DEFAULT nextval('order_number_seq');

-- 3. Order Items updates
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 4. RPC for Stock Management
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void AS \$\$
BEGIN
    UPDATE public.products
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = p_product_id;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Link existing records (Backfill)
UPDATE public.orders SET updated_at = created_at WHERE updated_at IS NULL;

-- 6. Trigger for profile linking (Ensure exists)
CREATE OR REPLACE FUNCTION link_orders_to_user()
RETURNS TRIGGER AS \$\$
BEGIN
  UPDATE public.orders 
  SET user_id = NEW.id
  WHERE customer_mobile = NEW.mobile AND user_id IS NULL;
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION link_orders_to_user();

-- 7. Update Aerator Names (Full Model Numbers)
UPDATE public.products SET name = 'AQUA LION 2HP 4 Paddle Wheel Aerator Set (PR 20 B)' WHERE slug = 'aqualion-2hp-4-paddle-pr20b';
UPDATE public.products SET name = 'AQUA LION 2HP 4 Paddle Wheel Aerator Set (PR 20 NB)' WHERE slug = 'aqualion-2hp-4-paddle-pr20nb';
UPDATE public.products SET name = 'AQUA LION 2HP 4 Paddle Wheel Aerator Set (PR 20 CMB)' WHERE slug = 'aqualion-2hp-4-paddle-pr20cmb';
UPDATE public.products SET name = 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set (HV-13-W)' WHERE slug = 'seaboss-2hp-4-paddle-hv13w';
UPDATE public.products SET name = 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set (HV-13-B)' WHERE slug = 'seaboss-2hp-4-paddle-hv13b';
UPDATE public.products SET name = 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set (PR-14-W)' WHERE slug = 'seaboss-2hp-4-paddle-pr14w';
UPDATE public.products SET name = 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set (PR-14-B)' WHERE slug = 'seaboss-2hp-4-paddle-pr14b';
UPDATE public.products SET name = 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set SS 304 Frame (PR 14 BSS)' WHERE slug = 'seaboss-2hp-4-paddle-pr14bss';

-- 8. Data Consistency (Gearbox Model Numbers)
UPDATE public.products 
SET specifications = jsonb_set(specifications, '{Model number}', '\"AQUA LION A3\"')
WHERE name = 'Aqualion A3 Bevel Gearbox';

-- 9. Category Normalization (Migration from plural/old to normalized names)
-- First drop the old restrictive check constraint if it exists
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- Update categories to normalized names
UPDATE public.products SET category = 'aerator-set' WHERE category = 'aerators';
UPDATE public.products SET category = 'motor' WHERE category = 'motors';
UPDATE public.products SET category = 'bevel-gearbox' WHERE category = 'gearboxes' AND (name ILIKE '%bevel%' OR name ILIKE '% A3 %');
UPDATE public.products SET category = 'long-arm-gearbox' WHERE category = 'gearboxes' AND name ILIKE '%long arm%';
UPDATE public.products SET category = 'worm-gearbox' WHERE category = 'gearboxes' AND category NOT IN ('bevel-gearbox', 'long-arm-gearbox');
UPDATE public.products SET category = 'spares' WHERE category = 'spares'; 

-- Re-add a more inclusive check constraint covering all new types
ALTER TABLE public.products ADD CONSTRAINT products_category_check 
CHECK (category IN (
    'aerator-set', 'motor', 'worm-gearbox', 'bevel-gearbox', 'long-arm-gearbox', 
    'long-arm-spare', 'kit-box', 'rod', 'frame', 'fan', 'float', 'motor-cover', 'spares'
));
"

echo "Applying SQL migrations..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "$REPAIR_SQL"

echo "--- Repair Complete ---"
echo "Please run: npm run build && pm2 restart website"
