const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = envConfig.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    console.log('Fetching one product to inspect schema...');

    // Fetch one product
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return;
    }

    console.log('--- Product Schema Sample ---');
    console.log(Object.keys(data));
    console.log('--- Product Data Sample ---');
    console.log(JSON.stringify(data, null, 2));
}

checkProducts();
