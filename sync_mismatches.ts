import { createClient } from '@supabase/supabase-js';
import { allProducts } from './src/data/products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, slug, specifications');
    
  if (error) {
    console.error("Error fetching db products", error);
    return;
  }

  let updateCount = 0;

  for (const dbP of dbProducts) {
    let localP = allProducts.find(p => p.slug === dbP.slug);
    
    if (!localP) {
      if (dbP.slug === 'seaboss-2hp-4-paddle-pr15bss') {
        localP = allProducts.find(p => p.slug === 'seaboss-2hp-4-paddle-pr14bss');
      } else {
        localP = allProducts.find(p => p.name.includes(dbP.name) || dbP.name.includes(p.name));
      }
    }

    if (localP) {
      let needsUpdate = false;
      let newSpecs = { ...dbP.specifications };

      if (dbP.name !== localP.name) needsUpdate = true;
      if (dbP.slug !== localP.slug) needsUpdate = true;
      
      const dbModel = dbP.specifications?.['Model number'] || dbP.specifications?.model || dbP.specifications?.Model;
      const localModel = localP.specifications?.['Model number'] || localP.specifications?.model || localP.specifications?.Model;
      
      if (dbModel !== localModel && localModel) {
        needsUpdate = true;
        if (newSpecs['Model number']) newSpecs['Model number'] = localModel;
        else if (newSpecs['model']) newSpecs['model'] = localModel;
        else if (newSpecs['Model']) newSpecs['Model'] = localModel;
        else newSpecs['Model number'] = localModel;
      }

      if (needsUpdate) {
        console.log(`Updating ${dbP.id} to name=${localP.name}, slug=${localP.slug}, model=${localModel}`);
        const { error: updateError } = await supabase.from('products').update({
          name: localP.name,
          slug: localP.slug,
          specifications: newSpecs
        }).eq('id', dbP.id);
        
        if (updateError) console.error("Update failed:", updateError);
        else updateCount++;
      }
    }
  }
  
  console.log(`Successfully updated ${updateCount} products.`);
}

sync();
