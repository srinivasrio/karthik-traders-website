const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found');
    process.exit(1);
}

const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = envConfig.split('\n').reduce((acc, line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        acc[match[1]] = val;
    }
    return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBrandColumn() {
    console.log('Checking if brand column exists on the products table...');
    
    // Try to fetch a single row with the brand column explicitly selected
    const { data, error } = await supabase
        .from('products')
        .select('id, name, brand')
        .limit(1);

    if (error) {
        console.log('\n❌ VERIFICATION FAILED:');
        console.log('Error Message:', error.message);
        console.log('Error Code:', error.code);
        
        if (error.message.includes('brand') || error.message.includes('column') || error.code === 'PGRST205') {
            console.log('\nRoot Cause: The brand column is missing in the database table or not recognized in the Supabase schema cache.');
            console.log('\nAction Required:');
            console.log('1. Connect to the VPS and run the database helper script:');
            console.log('   ./vps_add_brand_column.sh');
            console.log('2. Alternatively, run the following SQL commands in your Supabase SQL editor:');
            console.log('   ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;');
            console.log("   NOTIFY pgrst, 'reload schema';");
        }
    } else {
        console.log('\n✅ VERIFICATION SUCCESSFUL:');
        console.log('The brand column exists and is recognized in the Supabase schema cache!');
        if (data && data.length > 0) {
            console.log('Sample product record containing brand:', data[0]);
        } else {
            console.log('The products table is currently empty, but the column is defined correctly.');
        }
    }
}

verifyBrandColumn();
