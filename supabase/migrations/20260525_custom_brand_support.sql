-- Migration: Support custom brands by ensuring products.brand column exists and is TEXT
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ALTER COLUMN brand TYPE TEXT;

