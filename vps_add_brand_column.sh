#!/bin/bash
# vps_add_brand_column.sh
# This script adds the brand column to public.products and refreshes the PostgREST schema cache on the VPS.

echo "--- Karthik Traders Add Brand Column Tool ---"

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
MIGRATION_SQL="ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT; ALTER TABLE public.products ALTER COLUMN brand TYPE TEXT; NOTIFY pgrst, 'reload schema';"

echo "Applying SQL migration and reloading PostgREST schema cache..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "$MIGRATION_SQL"

echo "--- Migration Complete ---"
echo "Please run: npm run build && pm2 restart website"
