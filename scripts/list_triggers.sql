
-- List triggers on order_items to find potential culprits
SELECT 
    tgname as trigger_name,
    tgtype,
    proname as function_name,
    prosrc as function_source
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'order_items'::regclass;
