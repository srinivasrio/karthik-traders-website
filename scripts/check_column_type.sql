DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'order_items' 
          AND column_name = 'product_id' 
          AND data_type = 'text'
    ) THEN
        RAISE EXCEPTION 'product_id is NOT text';
    END IF;
END $$;
