#!/bin/bash
# add_product_db.sh
# Helper script to add HV 20 B to self-hosted Supabase

# Find Supabase DB container
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep "db" | grep "supabase" | head -n 1)

if [ -z "$DB_CONTAINER" ]; then
    DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep "postgres" | head -n 1)
fi

if [ -z "$DB_CONTAINER" ]; then
  echo "Error: Could not find Supabase DB container."
  exit 1
fi

echo "Found DB Container: $DB_CONTAINER"
echo "Adding AQUA LION HV 20 B to products table..."

docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -c "
INSERT INTO public.products (name, slug, category, price, mrp, stock, is_active, images, specifications, description) 
VALUES ('AQUA LION 2HP 4 Paddle Wheel Aerator Set (HV 20 B)', 'aqualion-2hp-4-paddle-hv20b', 'aerators', 28499, 30000, 100, true, '{\"/images/products/Aerator sets/Aqualion/AQUA LION 2HP 4 Paddle Wheel Aerator Set.png\"}', '{\"Product Name\":\"AQUA LION 2HP 4 PADDLE WHEEL AERATOR SET\",\"Type of Aerator\":\"Surface Floating paddle Aerator\",\"Usage / Application\":\"Shrimp & Fish Farming Ponds Aeration\",\"Brand\":\"AQUA LION\",\"Model number\":\"HV 20 B\",\"Float & Dom Color\":\"Dark Blue\",\"Motor Power\":\"2HP\",\"Motor Type\":\"Heavy Duty Motor ( iso certified )\",\"Motor Phase\":\"3 Phase\",\"Voltage\":\"415 v\",\"Frequency\":\"50 Hz\",\"Gear Box Type\":\"A3 Bevel\",\"Gear Box RPM\":\"105\",\"Gear Box & Motor material\":\"Cast iron Body with Powder Coating\",\"Treatment Technique\":\"Aeration System\",\"No. of Paddle\":\"4\",\"Fan & Float Material\":\"Virgin PPCP (Fan) & Virgin HDPE (Float)\",\"Fan Weight\":\"2.2 Kg APX\",\"Float Weight\":\"7KG\",\"Dom Type\":\"HDPE Handle Dom\",\"Frame & Rod Material\":\"SS 202 CR Finishing\",\"Frame Weight\":\"8 Kg\",\"Frame Thickness\":\"2 MM\",\"Visible Flow\":\"30 - 35 meters\",\"Effective Flow / Circulation Range\":\"35 - 40 meters\",\"Oxygen Generation\":\"3.0 - 3.2 Kg O2 / Hour\",\"Power Consumption\":\"1.6 - 2 Units / Hour\",\"Installation Services Available\":\"NO\",\"Maintenance\":\"LOW COST\",\"Water Depth Suitable\":\"3 - 5 Feet\",\"Pond Coverage\":\"0.75 - 1 acre\",\"Automation Grade\":\"Automatic\",\"Power Source\":\"Electric\",\"Total Set Weight\":\"100 Kg\",\"Starter\":\"no\",\"Wire\":\"no\",\"Gear Oil\":\"no\",\"Warranty\":\"1 year warranty\",\"Country of Origin\":\"MADE IN INDIA\",\"brand\":\"aqualion\",\"model\":\"HV 20 B\",\"features\":[\"Aqualion 2HP Heavy Duty Motor (ISO Certified)\",\"A3 Bevel Gearbox (105 RPM)\",\"SS 202 Frame (2mm Thickness)\",\"Virgin HDPE Floats (7kg)\",\"1 Year Warranty\"],\"components\":[{\"item\":\"MOTOR\",\"spec\":\"2HP Heavy Duty Motor ( iso certified ) - 3 Phase\",\"quantity\":1},{\"item\":\"GEAR BOX\",\"spec\":\"A3 Bevel - 105 RPM\",\"quantity\":1},{\"item\":\"FLOAT\",\"spec\":\"7KG - Virgin HDPE (UV)\",\"quantity\":3},{\"item\":\"MOULDING FAN\",\"spec\":\"2.2 Kg APX - Virgin PPCP (UV)\",\"quantity\":4},{\"item\":\"MOTOR COVER / DOOM\",\"spec\":\"HDPE Handle Dom\",\"quantity\":1},{\"item\":\"STAINLESS-STEEL FRAME\",\"spec\":\"SS 202 CR Finishing - 9 Kg - 2 MM\",\"quantity\":1},{\"item\":\"STAINLESS-STEEL FAN ROD\",\"spec\":\"SS 202 CR Finishing\",\"quantity\":2},{\"item\":\"KITBOX\",\"spec\":\"BOLT & NUTS, RUBBERS, GLANDS, BUSH STAND\",\"quantity\":1},{\"item\":\"STARTER\",\"spec\":\"no\",\"quantity\":0},{\"item\":\"WIRE\",\"spec\":\"no\",\"quantity\":0},{\"item\":\"GEAR OIL\",\"spec\":\"no\",\"quantity\":0},{\"item\":\"WARRANTY\",\"spec\":\"1 year warranty\",\"quantity\":\"\"}],\"warranty\":\"1 Year Warranty\"}', NULL)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    mrp = EXCLUDED.mrp,
    specifications = EXCLUDED.specifications;
"

echo "Done!"
"
