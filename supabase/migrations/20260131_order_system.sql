-- Order System Migration
-- Adds support for admin-created orders and phone-based order linking

-- 1. Add new columns to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS customer_mobile text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS created_by_admin boolean DEFAULT false;

-- 2. Make user_id nullable (for orders before customer registration)
ALTER TABLE public.orders 
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add index for efficient phone-based lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_mobile ON public.orders(customer_mobile);

-- 4. Update RLS policies to allow admin to create orders without user_id

-- Drop existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

-- Allow authenticated users to insert orders (will validate in API)
CREATE POLICY "Authenticated users can insert orders" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Admin can insert orders for any customer
CREATE POLICY "Admins can insert orders" ON public.orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view orders by their user_id OR their mobile number
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id 
    OR customer_mobile = (
      SELECT mobile FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 5. Create trigger function to auto-link orders when user registers
CREATE OR REPLACE FUNCTION link_orders_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Update orders where mobile matches and user_id is null
  UPDATE public.orders 
  SET user_id = NEW.id
  WHERE customer_mobile = NEW.mobile AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION link_orders_to_user();

-- 7. Backfill: Link existing orders to users by mobile
UPDATE public.orders o
SET user_id = p.id
FROM public.profiles p
WHERE o.customer_mobile = p.mobile 
  AND o.user_id IS NULL;

-- 8. Update existing orders to have customer_mobile from profiles
UPDATE public.orders o
SET customer_mobile = p.mobile,
    customer_name = COALESCE(o.customer_name, p.full_name)
FROM public.profiles p
WHERE o.user_id = p.id 
  AND o.customer_mobile IS NULL;
