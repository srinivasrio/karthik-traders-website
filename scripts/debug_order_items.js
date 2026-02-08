const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = envConfig.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- Checking order_items Schema ---');

    // Attempt to insert a dummy order item with a SLUG to see if it fails matches constraint
    // Actually, just checking the "order_items" data type requires SQL or an error message.

    // Let's try to fetch a recent order item and see what's in 'product_id'
    const { data: recentItems, error } = await supabase
        .from('order_items')
        .select('*')
        .limit(5)
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching items:', error);
    } else {
        console.log('Recent Order Items:', recentItems);
        if (recentItems.length > 0) {
            const sample = recentItems[0];
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sample.product_id);
            console.log(`Sample product_id: ${sample.product_id}`);
            console.log(`Is UUID? ${isUuid}`);

            // If it is a UUID, and our trigger expects SLUG, that is the bug.
        }
    }
}

checkSchema();
