-- ROBUST STOCK REDUCTION TRIGGER
-- This handles cases where order_items.product_id might be a Slug OR a UUID.

-- 1. Create or Replace the Function
CREATE OR REPLACE FUNCTION update_stock() RETURNS TRIGGER AS $$
DECLARE
  rows_affected integer;
BEGIN
  -- Attempt 1: Try to update by matching SLUG (Most common for new orders)
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE slug = NEW.product_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  -- Attempt 2: If no rows updated, try matching by UUID (Legacy/Fallback)
  IF rows_affected = 0 THEN
    BEGIN
      -- Cast id to text to compare with product_id (which is text)
      UPDATE products
      SET stock = stock - NEW.quantity
      WHERE id::text = NEW.product_id;
    EXCEPTION WHEN OTHERS THEN
      -- If NEW.product_id is not a valid UUID, this might throw an error. 
      -- We catch it to ensure the Order isn't blocked.
      RAISE WARNING 'Stock update failed for product_id: %, likely invalid UUID', NEW.product_id;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop the existing trigger if it exists (to ensure we use the new function)
DROP TRIGGER IF EXISTS reduce_stock_after_order ON order_items;

-- 3. Re-create the Trigger
CREATE TRIGGER reduce_stock_after_order
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_stock();

-- Confirmation
SELECT 'Stock Reduction Trigger Successfully Updated' as status;
