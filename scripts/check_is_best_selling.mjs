import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read workspace .env.local
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        envVars[match[1]] = val;
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    const { data, error } = await supabase.from('products').select('id, name, is_best_selling').limit(1);
    if (error) {
        console.log('Error fetching is_best_selling:', error.message || error);
    } else {
        console.log('Success! is_best_selling column exists:', data);
    }
}
check();
