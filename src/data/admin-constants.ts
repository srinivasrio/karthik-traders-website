// Admin Product Management Constants
// Centralized definitions for categories, brands, and stock statuses

export const CATEGORIES = [
  { value: 'aerator-set', label: 'Aerator Set', group: 'Aerators' },
  { value: 'motor', label: 'Motor', group: 'Motors' },
  { value: 'worm-gearbox', label: 'Worm Gearbox', group: 'Gearboxes' },
  { value: 'bevel-gearbox', label: 'Bevel Gearbox', group: 'Gearboxes' },
  { value: 'long-arm-gearbox', label: 'Long Arm Gearbox', group: 'Long Arm' },
  { value: 'long-arm-spare', label: 'Long Arm Spare', group: 'Long Arm' },
  { value: 'kit-box', label: 'Kit Box', group: 'Spares' },
  { value: 'rod', label: 'Rod', group: 'Spares' },
  { value: 'frame', label: 'Frame', group: 'Spares' },
  { value: 'fan', label: 'Fan', group: 'Spares' },
  { value: 'float', label: 'Float', group: 'Spares' },
  { value: 'motor-cover', label: 'Motor Cover', group: 'Spares' },
  { value: 'warranty', label: 'Warranty', group: 'Other' },
] as const;

export const CATEGORY_GROUPS: { group: string; categories: string[] }[] = [
  { group: 'Aerators', categories: ['aerator-set'] },
  { group: 'Motors', categories: ['motor'] },
  { group: 'Gearboxes', categories: ['worm-gearbox', 'bevel-gearbox'] },
  { group: 'Long Arm', categories: ['long-arm-gearbox', 'long-arm-spare'] },
  { group: 'Spares', categories: ['kit-box', 'rod', 'frame', 'fan', 'float', 'motor-cover'] },
  { group: 'Other', categories: ['warranty'] },
];

export const BRANDS = [
  { value: 'aqualion', label: 'Aqua Lion', color: '#FFCE47', bgClass: 'bg-amber-100 text-amber-800' },
  { value: 'seaboss', label: 'Sea Boss', color: '#4ED7F1', bgClass: 'bg-sky-100 text-sky-800' },
  { value: 'custom', label: 'Custom', color: '#A855F7', bgClass: 'bg-purple-100 text-purple-800' },
] as const;

export const STOCK_STATUSES = [
  { value: 'in-stock', label: 'In Stock', color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'limited', label: 'Limited Stock', color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'out-of-stock', label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50' },
] as const;

// Category filter groups for the admin product list
export const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', categories: [] as string[] },
  { id: 'aerators', label: 'Aerators', categories: ['aerator-set', 'aerators'] },
  { id: 'motors', label: 'Motors', categories: ['motor', 'motors'] },
  { id: 'gearboxes', label: 'Gearboxes', categories: ['gearbox', 'gearboxes', 'worm-gearbox', 'bevel-gearbox', 'long-arm-gearbox'] },
  { id: 'spares', label: 'Spares', categories: ['spares', 'spare', 'kit-box', 'rod', 'frame', 'fan', 'float', 'motor-cover', 'long-arm-spare'] },
  { id: 'long-arm', label: 'Long Arm', categories: ['long-arm', 'long-arm-gearbox', 'long-arm-spare'] },
];

// Spec templates — pre-fill common spec keys based on category
export const SPEC_TEMPLATES: Record<string, string[]> = {
  'aerator-set': [
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
  ],
  'motor': [
    'Power (HP/KW)', 'Frame', 'Voltage', 'Speed', 'Insulation',
    'Motor Body', 'Efficiency', 'IP Rating', 'Phase', 'Frequency', 'Duty',
  ],
  'worm-gearbox': [
    'Type', 'Application', 'Ratio', 'Input Speed', 'Output Speed',
    'Housing Material', 'Worm Wheel', 'Worm Shaft', 'Bearings',
    'Oil Capacity', 'Weight', 'Mounting',
  ],
  'bevel-gearbox': [
    'RPM', 'Gear Type', 'Body', 'Protection', 'Shaft OD',
    'Shaft Material', 'Color', 'Bearing Sizes',
  ],
  'long-arm-gearbox': [
    'Model', 'RPM', 'Type', 'Brand', 'Application',
  ],
  'float': [
    'Material', 'Weight', 'Color', 'Length', 'Width', 'Height', 'Type',
  ],
  'frame': [
    'Material', 'Weight', 'Compatibility', 'Application', 'Thickness',
  ],
  'rod': [
    'Material', 'Weight', 'Thickness', 'Diameter', 'Length', 'Finish', 'Compatibility',
  ],
  'fan': [
    'Material', 'Weight', 'Color', 'Bush', 'Type',
  ],
  'kit-box': [
    'HV Bush Stand', 'Joint Rubber', 'Glands & Bolts', 'SS Bolt, Nut & Washer',
  ],
  'motor-cover': [
    'Type', 'Material', 'Compatibility', 'Water Resistance', 'Color', 'Ventilation', 'Life Span',
  ],
};

// Feature templates — pre-fill common marketing / key highlight bullet points
export const FEATURE_TEMPLATES: Record<string, string[]> = {
  'aerator-set': [
    'Heavy-Duty Copper Wound Energy Efficient Motor (ISO Certified)',
    'Precision Bevel / Worm Gearbox with High Torque Output (105 RPM)',
    'UV-Stabilized Virgin HDPE Floats & High Impact Impeller Paddles',
    'Corrosion-Resistant SS 304 / SS 202 Frame & Drive Shafts',
    'High Oxygen Transfer Rate & Long-Distance Water Circulation',
    'Comprehensive Warranty with Local Genuine Spares Support in Nellore'
  ],
  'motor': [
    '100% Pure Copper Winding for Maximum Electrical Efficiency',
    'ISO 9001 Certified Industrial Continuous Duty Motor',
    'High Starting Torque & Thermal Overload Protection',
    'Cast Iron Rigid Body with Anti-Corrosion Protective Coating',
    'IP55 Ingress Protection against Water Splash and Dust'
  ],
  'worm-gearbox': [
    'Heavy-Duty Cast Iron Housing for Maximum Durability',
    'Precision Phosphorus Bronze Worm Wheel & Hardened Steel Shaft',
    'Smooth Low-Noise Power Transmission with 105 RPM Output',
    'Factory Tested Leak-Proof Seals with EP 140 Synthetic Oil Capacity',
    'Designed for 24/7 Continuous Pond Aeration Operations'
  ],
  'bevel-gearbox': [
    'High-Efficiency Bevel Gear Drive with Reduced Power Loss',
    'Rugged Cast Iron / Nylon Composite Housing with Powder Coating',
    'Precision Machined Bevel Gears for Heavy Duty 2HP & 3HP Aerators',
    'Stainless Steel Drive Shafts & High-Precision Bearings'
  ],
  'long-arm-gearbox': [
    'Specially Engineered for Deep Pond Long-Arm Aeration Systems',
    'Heavy Torque Multiplication with Vibration-Dampened Gears',
    'Extended Operating Life in High Salinity Aquaculture Environments'
  ],
  'float': [
    'Manufactured from 100% Virgin HDPE with UV Stabilizers',
    'Seamless One-Piece Blow Molded Construction Prevents Water Ingress',
    'High Buoyancy & Pond Stability in Heavy Wind and Wave Conditions'
  ],
  'fan': [
    'Engineered 8-Spline Impeller Fan Blades for Maximum Aeration Spray',
    'Virgin PP Material with Heavy Brass Bush Insert',
    'High Water Displacement with Low Power Drag on Motor'
  ],
  'spares': [
    'Genuine OEM Replacement Component from Karthik Traders',
    'Direct Factory Fitment for Standard Indian & Imported Aerator Sets',
    'Corrosion Resistant Finish for Prolonged Pond Immersion'
  ]
};

export type CategoryValue = typeof CATEGORIES[number]['value'];
export type BrandValue = typeof BRANDS[number]['value'];
