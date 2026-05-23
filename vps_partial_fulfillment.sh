#!/bin/bash
# vps_partial_fulfillment.sh
# This script applies the partial stock order management migration on the self-hosted VPS.

echo "--- Karthik Traders Add Partial Fulfillment Columns Tool ---"

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
MIGRATION_SQL="
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS fulfilled_quantity INTEGER;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS out_of_stock_reason TEXT;
UPDATE public.order_items SET fulfilled_quantity = quantity WHERE fulfilled_quantity IS NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS include_oos_in_invoice BOOLEAN DEFAULT false;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
    'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'rejected', 
    'completed', 'partially_fulfilled', 'out_of_stock'
));

NOTIFY pgrst, 'reload schema';
"

echo "Applying SQL migration and reloading PostgREST schema cache..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "$MIGRATION_SQL"

echo "--- Migration Complete ---"
echo "Please run: npm run build && pm2 restart website"
