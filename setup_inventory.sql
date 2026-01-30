-- 1. Create Function to Deduct Stock
CREATE OR REPLACE FUNCTION public.reduce_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stock for the product
  UPDATE public.products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  -- Prevent negative stock (Optional: remove this check if backorders are allowed)
  IF (SELECT stock FROM public.products WHERE id = NEW.product_id) < 0 THEN
     RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger on Order Items
DROP TRIGGER IF EXISTS trigger_reduce_stock ON public.order_items;
CREATE TRIGGER trigger_reduce_stock
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.reduce_stock_on_order();
