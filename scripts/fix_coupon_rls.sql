-- Enable RLS on the table if not already enabled (good practice)
ALTER TABLE coupon_aerators ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON coupon_aerators;

-- Create a policy that allows anyone (anon and authenticated) to SELECT
CREATE POLICY "Enable read access for all users" 
ON coupon_aerators FOR SELECT 
TO public 
USING (true);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'coupon_aerators';
