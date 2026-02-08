const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const updates = [
    { slug: 'aqualion-2hp-4-paddle-pr20b', color: 'Dark Blue' },
    { slug: 'aqualion-2hp-4-paddle-pr20nb', color: 'Dark Blue' },
    { slug: 'aqualion-2hp-4-paddle-pr20cmb', color: 'Dark Blue' },
    { slug: 'seaboss-2hp-4-paddle-hv13w', color: 'Blue' },
    { slug: 'seaboss-2hp-4-paddle-hv13b', color: 'Blue' },
    { slug: 'seaboss-2hp-4-paddle-pr14w', color: 'Dark Blue' },
    { slug: 'seaboss-2hp-4-paddle-pr14b', color: 'Dark Blue' },
    { slug: 'seaboss-2hp-4-paddle-pr14bss', color: 'Dark Blue' }
];

async function updateColors() {
    console.log('Starting update of aerator specifications (Float & Dom Color)...');

    for (const item of updates) {
        try {
            // 1. Fetch current product to retrieve specifications
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('specifications')
                .eq('slug', item.slug)
                .single();

            if (fetchError) {
                console.error(`Error fetching ${item.slug}:`, fetchError.message);
                continue;
            }

            if (!product) {
                console.warn(`Product not found: ${item.slug}`);
                continue;
            }

            // 2. Update specifications JSON
            const currentSpecs = product.specifications || {};

            // Remove old "Color" key if it exists
            if (currentSpecs['Color']) {
                delete currentSpecs['Color'];
            }

            // Add new "Float & Dom Color" key
            const updatedSpecs = {
                ...currentSpecs,
                'Float & Dom Color': item.color
            };

            // 3. Save back to DB
            const { error: updateError } = await supabase
                .from('products')
                .update({ specifications: updatedSpecs })
                .eq('slug', item.slug);

            if (updateError) {
                console.error(`Error updating ${item.slug}:`, updateError.message);
            } else {
                console.log(`Updated ${item.slug} -> Removed 'Color', Added 'Float & Dom Color': ${item.color}`);
            }

        } catch (err) {
            console.error(`Unexpected error for ${item.slug}:`, err);
        }
    }

    console.log('Update complete.');
}

updateColors();
