// Reusable aerator specification template and sorting utilities

export const AERATOR_SPEC_ORDER = [
    'Brand',
    'Voltage',
    'Dom Type',
    'Warranty',
    'Frequency',
    'Fan Weight',
    'Motor Type',
    'Motor Phase',
    'Motor Power',
    'maintenance',
    'Float Weight',
    'Frame Weight',
    'Gear Box RPM',
    'Power Source',
    'Product Name',
    'Visible Flow',
    'No of Paddle',
    'Pond Coverage',
    'Frame thickness',
    'Type of Aerator',
    'Automation Grade',
    'Total Set Weight',
    'Float and Dom Color',
    'Power Consumption',
    'Treatment Technique',
    'Usage Application',
    'Fan and Float Material',
    'Frame and Rod Material',
    'Water Depth Suitable',
    'Oxygen Generation Real',
    'Gear Box and Motor material',
    'Installation Services Available',
    'Effective Flow Circulation Range'
];

const specIndexMap = new Map<string, number>();
AERATOR_SPEC_ORDER.forEach((spec, index) => {
    specIndexMap.set(spec.toLowerCase().trim(), index);
});

/**
 * Checks if a product belongs to the aerator category
 */
export function isAeratorCategory(product: { category?: string }): boolean {
    if (!product || !product.category) return false;
    const cat = product.category.toLowerCase().trim();
    return cat === 'aerator-set' || cat === 'aerators';
}

/**
 * Checks if a product is the specific Aqualion PR20CMB model which should bypass customization/standardization
 */
export function isPR20CMB(product: { id?: string; slug?: string; model?: string }): boolean {
    if (!product) return false;
    
    const id = (product.id || '').toLowerCase().trim();
    const slug = (product.slug || '').toLowerCase().trim();
    const model = (product.model || '').toLowerCase().trim();
    
    return (
        id === 'aqualion-pr20cmb' || 
        slug === 'aqualion-2hp-4-paddle-pr20cmb' || 
        model === 'pr 20 cmb'
    );
}

/**
 * Returns sorted entries of specifications according to the standardized template if the product is an aerator
 */
export function getSortedSpecifications(product: {
    category?: string;
    id?: string;
    slug?: string;
    model?: string;
    specifications?: Record<string, any>;
}): [string, any][] {
    if (!product || !product.specifications) return [];

    const specs = product.specifications;
    const entries = Object.entries(specs);

    if (!isAeratorCategory(product) || isPR20CMB(product)) {
        return entries;
    }

    return [...entries].sort(([keyA], [keyB]) => {
        const cleanA = keyA.toLowerCase().trim();
        const cleanB = keyB.toLowerCase().trim();
        
        const idxA = specIndexMap.has(cleanA) ? specIndexMap.get(cleanA)! : 1000;
        const idxB = specIndexMap.has(cleanB) ? specIndexMap.get(cleanB)! : 1000;
        
        if (idxA !== idxB) {
            return idxA - idxB;
        }
        return keyA.localeCompare(keyB);
    });
}

/**
 * Sorts an array of specification keys (useful for comparison view)
 */
export function sortSpecificationKeys(
    keys: string[],
    product?: { category?: string; id?: string; slug?: string; model?: string }
): string[] {
    const isAerator = product ? isAeratorCategory(product) : true;
    const isSpecial = product ? isPR20CMB(product) : false;

    if (!isAerator || isSpecial) {
        return keys;
    }

    return [...keys].sort((keyA, keyB) => {
        const cleanA = keyA.toLowerCase().trim();
        const cleanB = keyB.toLowerCase().trim();
        
        const idxA = specIndexMap.has(cleanA) ? specIndexMap.get(cleanA)! : 1000;
        const idxB = specIndexMap.has(cleanB) ? specIndexMap.get(cleanB)! : 1000;
        
        if (idxA !== idxB) {
            return idxA - idxB;
        }
        return keyA.localeCompare(keyB);
    });
}
