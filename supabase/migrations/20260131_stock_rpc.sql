-- Function to safely decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
