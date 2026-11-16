-- Migration: 20261116_delivery_features.sql
-- Add State-wise Delivery & Vehicle Dispatch fields to orders table

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS delivery_state TEXT,
    ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS delivery_estimated_days TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
    ADD COLUMN IF NOT EXISTS driver_name TEXT,
    ADD COLUMN IF NOT EXISTS driver_mobile TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS transport_name TEXT,
    ADD COLUMN IF NOT EXISTS lr_number TEXT,
    ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_state ON public.orders(delivery_state);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle_number ON public.orders(vehicle_number);
