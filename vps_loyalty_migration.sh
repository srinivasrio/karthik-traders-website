#!/bin/bash
# vps_loyalty_migration.sh
# Applies the Loyalty Points & Rewards System migration on the self-hosted VPS.

echo "=========================================================="
echo "   Karthik Traders - Loyalty & Rewards System Migration   "
echo "=========================================================="

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

MIGRATION_FILE="supabase/migrations/20261106_loyalty_system.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file $MIGRATION_FILE not found!"
  exit 1
fi

echo "Applying $MIGRATION_FILE..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres < "$MIGRATION_FILE"

echo "Reloading PostgREST schema cache..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "NOTIFY pgrst, 'reload schema';"

echo "=========================================================="
echo "   Loyalty System Migration Completed Successfully!      "
echo "=========================================================="
echo "Next step: npm run build && pm2 restart karthik-traders"

