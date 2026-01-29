
import * as fs from 'fs';
import { allProducts } from '../src/data/products';

// Helper to escape SQL strings
const escapeSql = (str: string | undefined) => {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
};

// Helper to format JSONB
const formatJson = (obj: any) => {
    if (!obj) return 'NULL';
    return `'${JSON.stringify(obj).replace(/'/g, "''")}'`;
};

// Helper to format Array
const formatArray = (arr: any[]) => {
    if (!arr || arr.length === 0) return "'{}'";
    const safest = arr.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',');
    return `'\{${safest}\}'`;
};

// Remove duplicates based on slug
const uniqueProducts = Array.from(new Map(allProducts.map(item => [item.slug, item])).values());

let sql = `-- Seed Products Data\n`;
sql += `DELETE FROM public.products;\n`;

uniqueProducts.forEach(p => {
    // Construct specs object
    const specs = {
        ...p.specifications,
        brand: p.brand,
        model: p.model,
        features: p.features,
        components: p.components, // might be undefined
        weight: p.weight,
        warranty: p.warranty
    };

    const values = [
        escapeSql(p.name),
        escapeSql(p.slug),
        // Map category
        mapCategory(p.category),

        p.salePrice,
        p.mrp,
        100, // stock
        true, // is_active
        formatArray(p.images || []),
        formatJson(specs),
        escapeSql(p.description || '')
    ];

    sql += `INSERT INTO public.products (name, slug, category, price, mrp, stock, is_active, images, specifications, description) VALUES (${values.join(', ')});\n`;
});

function mapCategory(cat: string) {
    if (cat === 'aerator-set') return escapeSql('aerators');
    if (cat === 'motor') return escapeSql('motors');
    if (cat.includes('gearbox')) return escapeSql('gearboxes');
    return escapeSql('spares');
}

fs.writeFileSync('seed.sql', sql);
console.log('Generated seed.sql with ' + uniqueProducts.length + ' products.');
