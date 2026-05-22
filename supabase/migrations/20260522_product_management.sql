-- Product Management Module Migration
-- Adds brand, warranty, updated_at columns
-- Creates storage bucket for product images
-- Migrates existing brand data from specifications JSONB

-- 1. Add brand column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;

-- 2. Add warranty column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty text;

-- 3. Add updated_at column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. Remove restrictive category constraint to support new/future categories
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- 5. Migrate existing brand data from specifications JSONB into brand column
UPDATE public.products
SET brand = specifications->>'brand'
WHERE brand IS NULL AND specifications->>'brand' IS NOT NULL;

-- 6. Migrate existing warranty data from specifications JSONB
UPDATE public.products
SET warranty = specifications->>'warranty'
WHERE warranty IS NULL AND specifications->>'warranty' IS NOT NULL;

-- 7. Create Supabase Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage policies for product images
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 9. Ensure admins can read ALL products (including inactive) for management
-- (Only add if doesn't exist - the existing policy only allows viewing active products)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'products' AND policyname = 'Admins can read all products'
  ) THEN
    CREATE POLICY "Admins can read all products" ON public.products
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;
