#!/bin/bash
# vps_add_best_selling.sh
# This script applies the best selling product column migration on the self-hosted VPS.

echo "--- Karthik Traders Add Best Selling Column Tool ---"

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
MIGRATION_SQL="ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_selling BOOLEAN DEFAULT false;"

echo "Applying SQL migration..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "$MIGRATION_SQL"

echo "--- Migration Complete ---"
echo "Please run: npm run build && pm2 restart website"
