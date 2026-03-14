import { createClient } from '@supabase/supabase-js';
import { allProducts } from './src/data/products'; // Note: Node might not like .ts imports unless we use tsx

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, slug, specifications');
    
  if (error) {
    console.error("Error fetching db products", error);
    return;
  }

  console.log(`Found ${dbProducts.length} products in DB.`);
  console.log(`Found ${allProducts.length} local products.`);

  for (const dbP of dbProducts) {
    // Try to find matching local product
    let localP = allProducts.find(p => p.slug === dbP.slug);
    
    if (!localP) {
      // Maybe the slug changed! Try matching by some similarity or checking known bad slugs
      if (dbP.slug === 'seaboss-2hp-4-paddle-pr15bss') {
        localP = allProducts.find(p => p.slug === 'seaboss-2hp-4-paddle-pr14bss');
      } else {
        // Try matching by name loosely
        localP = allProducts.find(p => p.name.includes(dbP.name) || dbP.name.includes(p.name));
      }
    }

    if (localP) {
      const mismatches = [];
      if (dbP.name !== localP.name) mismatches.push(`Name:\n  DB: ${dbP.name}\n  Local: ${localP.name}`);
      if (dbP.slug !== localP.slug) mismatches.push(`Slug:\n  DB: ${dbP.slug}\n  Local: ${localP.slug}`);
      
      const dbModel = dbP.specifications?.['Model number'] || dbP.specifications?.model || dbP.specifications?.Model;
      const localModel = localP.specifications?.['Model number'] || localP.specifications?.model || localP.specifications?.Model;
      
      if (dbModel !== localModel) mismatches.push(`Model:\n  DB: ${dbModel}\n  Local: ${localModel}`);

      if (mismatches.length > 0) {
        console.log(`\n--- Mismatch for ${dbP.id} ---`);
        mismatches.forEach(m => console.log(m));
      }
    } else {
      console.log(`\n--- Could not find local match for DB product: ${dbP.name} (${dbP.slug}) ---`);
    }
  }
}

check();
