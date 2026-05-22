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
  { value: 'generic', label: 'Generic / Other', color: '#94A3B8', bgClass: 'bg-slate-100 text-slate-600' },
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
    'Type of Aerator', 'Usage / Application', 'Motor Power', 'Motor Type', 'Motor Phase',
    'Voltage', 'Frequency', 'Gear Box Type', 'Gear Box RPM',
    'No. of Paddle', 'Fan & Float Material', 'Fan Weight', 'Float Weight',
    'Frame & Rod Material', 'Frame Weight', 'Frame Thickness',
    'Visible Flow', 'Effective Flow / Circulation Range',
    'Oxygen Generation', 'Power Consumption', 'Water Depth Suitable',
    'Pond Coverage', 'Total Set Weight', 'Country of Origin',
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

export type CategoryValue = typeof CATEGORIES[number]['value'];
export type BrandValue = typeof BRANDS[number]['value'];
