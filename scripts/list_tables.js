const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim().replace(/"/g, '');
    }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
    console.log('Listing tables in public schema...');

    // We can't easily query information_schema with supabase-js client directly unless we use rpc or if we have permissions.
    // Instead, let's try to select from a few likely tables to see if they exist.
    // Actually, without SQL execution capability, it's hard to list tables dynamically unless there's an RPC for it.
    // But wait, the previous `debug_coupons.js` worked. This means I can query tables.

    // Let's try to query 'products' and see if it works.
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.log("Error querying 'products' table:", error.message);
    } else {
        console.log("'products' table exists. Sample data:", data);
    }

    // Try 'inventory'
    const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .limit(1);

    if (inventoryError) {
        console.log("Error querying 'inventory' table:", inventoryError.message);
    } else {
        console.log("'inventory' table exists. Sample data:", inventoryData);
    }
}

listTables();
