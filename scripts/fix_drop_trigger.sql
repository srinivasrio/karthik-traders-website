-- Fix: Drop the stock reduction trigger that causes the UUID vs TEXT error.
-- The app uses string IDs ('seaboss-pr14bss') but the DB products table uses UUIDs.
-- The trigger tries to match string ID to UUID primary key, which fails.
-- Disabling this trigger allows orders to be placed. Stock updates will presumably be handled manually or fixed later.

DROP TRIGGER IF EXISTS trigger_reduce_stock ON public.order_items;
DROP FUNCTION IF EXISTS reduce_stock_on_order();
