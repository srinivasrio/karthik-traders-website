-- Migration to add best selling column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_selling BOOLEAN DEFAULT false;
