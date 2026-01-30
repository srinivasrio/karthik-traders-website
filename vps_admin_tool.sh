#!/bin/bash
# vps_admin_tool.sh
# Usage: ./vps_admin_tool.sh +919963840058

MOBILE=$1

if [ -z "$MOBILE" ]; then
  echo "Usage: ./vps_admin_tool.sh <MOBILE_NUMBER>"
  echo "Example: ./vps_admin_tool.sh +919963840058"
  exit 1
fi

echo "Searching for Supabase Database Container..."
# Find container name that usually contains 'db' and starts with supabase or is in the stack
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep "db" | grep "supabase" | head -n 1)

# Fallback search
if [ -z "$DB_CONTAINER" ]; then
    DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep "postgres" | head -n 1)
fi

if [ -z "$DB_CONTAINER" ]; then
  echo "Error: Could not find a running Supabase/Postgres container."
  echo "Please check if Docker is running: docker ps"
  exit 1
fi

echo "Found Container: $DB_CONTAINER"

echo "Setting role to 'admin' for user: $MOBILE..."

docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "
UPDATE auth.users SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '\"admin\"') WHERE phone = '$MOBILE';
UPDATE public.profiles SET role = 'admin' WHERE mobile = '$MOBILE';
"

echo "Verifying..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "SELECT mobile, role FROM public.profiles WHERE mobile = '$MOBILE';"

echo "Done! User is now an admin."
