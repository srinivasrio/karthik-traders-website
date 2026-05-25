-- Migration: Support custom brands by ensuring products.brand column is TEXT
ALTER TABLE public.products ALTER COLUMN brand TYPE TEXT;
