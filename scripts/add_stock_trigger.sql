CREATE OR REPLACE FUNCTION reduce_stock_after_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Match product by slug (stored in order_items.product_id)
  -- Note: product_id is TEXT containing the slug
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE slug = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reduce_stock ON order_items;

CREATE TRIGGER trigger_reduce_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION reduce_stock_after_order();
