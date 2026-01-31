// Complete Product Catalog for Karthik Traders
// Brands: Aqualion (Premium) & Sea Boss (Budget + Performance)

export type Brand = 'aqualion' | 'seaboss' | 'generic';

export type ProductCategory =
  | 'aerator-set'
  | 'motor'
  | 'worm-gearbox'
  | 'bevel-gearbox'
  | 'motor-cover'
  | 'float'
  | 'fan'
  | 'frame'
  | 'rod'
  | 'kit-box'
  | 'long-arm-gearbox'
  | 'long-arm-spare'
  | 'warranty';

export interface Product {
  id: string;
  slug: string;
  name: string;
  model?: string;
  brand: Brand;
  category: ProductCategory;
  mrp: number;
  salePrice: number;
  features: string[];
  components?: {
    item: string;
    spec?: string;
    quantity: string | number;
  }[];
  description?: string;
  specifications: Record<string, string>;
  warranty?: string;
  inStock: boolean;
  stockStatus?: 'in-stock' | 'limited' | 'out-of-stock';
  images?: string[];
  weight?: string;
  stock?: number;
  isActive?: boolean;
}

// ==========================================
// AERATOR SETS
// ==========================================


export const aeratorSets: Product[] = [
  // Aqualion Premium Sets
  {
    id: 'aqualion-pr20b',
    slug: 'aqualion-2hp-4-paddle-pr20b',
    name: 'AQUA LION 2HP 4 Paddle Wheel Aerator Set (PR 20 B)',
    model: 'PR 20 B',
    brand: 'aqualion',
    category: 'aerator-set',
    mrp: 34000,
    salePrice: 32999,
    features: [
      'Aqualion 2HP Heavy Duty Motor (ISO Certified)',
      'A3 Bevel Gearbox (106 RPM)',
      'SS 304 Frame (3mm Thickness)',
      'Virgin HDPE Floats (7kg)',
      'Double Warranty'
    ],
    components: [
      { item: 'MOTOR', spec: '2HP Heavy Duty Motor ( iso certified ) - 3 Phase', quantity: 1 },
      { item: 'GEAR BOX', spec: 'A3 Bevel - 106 RPM', quantity: 1 },
      { item: 'FLOAT', spec: '7KG - Virgin HDPE (UV)', quantity: 3 },
      { item: 'MOULDING FAN', spec: '2.2 Kg APX - Virgin PPCP (UV)', quantity: 4 },
      { item: 'MOTOR COVER / DOOM', spec: 'HDPE Handle Dom', quantity: 1 },
      { item: 'STAINLESS-STEEL FRAME', spec: 'SS 304 CR Finishing - 9 Kg - 3 MM', quantity: 1 },
      { item: 'STAINLESS-STEEL FAN ROD', spec: 'SS 304 CR Finishing', quantity: 2 },
      { item: 'KITBOX', spec: 'BOLT & NUTS, RUBBERS, GLANDS, BUSH STAND', quantity: 1 },
      { item: 'STARTER', spec: 'no', quantity: 1 },
      { item: 'WIRE', spec: 'no', quantity: 1 },
      { item: 'GEAR OIL', spec: 'EP 140 Synthetic oil (2LT)', quantity: 1 },
      { item: 'WARRANTY', spec: '1 year warranty + 1 year Service warranty', quantity: '' },
    ],
    specifications: {
      'Product Name': 'AQUA LION 2HP 4 PADDLE WHEEL AERATOR SET',
      'Type of Aerator': 'Surface Floating paddle Aerator',
      'Usage / Application': 'Shrimp & Fish Farming Ponds Aeration',
      'Brand': 'AQUA LION',
      'Model number': 'PR 20 B',
      'Motor Power': '2HP',
      'Motor Type': 'Heavy Duty Motor ( iso certified )',
      'Motor Phase': '3 Phase',
      'Voltage': '415 v',
      'Frequency': '50 Hz',
      'Gear Box Type': 'A3 Bevel',
      'Gear Box RPM': '106',
      'Gear Box & Motor material': 'Cast Iron Body With Powder Coating',
      'Treatment Technique': 'Aeration System',
      'No. of Paddle': '4',
      'Fan & Float Material': 'Virgin PPCP (Fan) & Virgin HDPE (Float)',
      'Fan Weight': '2.2 Kg APX',
      'Float Weight': '7KG',
      'Dom Type': 'HDPE Handle Dom',
      'Frame & Rod Material': 'SS 304 CR Finishing',
      'Frame Weight': '9 Kg',
      'Frame Thickness': '3 MM',
      'Visible Flow': '30 - 35 meters',
      'Effective Flow / Circulation Range': '35 - 40 meters',
      'Oxygen Generation': '3.0 - 3.2 Kg O2 / Hour',
      'Power Consumption': '1.6 - 2 Units / Hour',
      'Installation Services Available': 'NO',
      'Maintenance': 'LOW COST',
      'Water Depth Suitable': '3 - 5 Feet',
      'Pond Coverage': '0.75 - 1 acre',
      'Automation Grade': 'Automatic',
      'Power Source': 'Electric',
      'Total Set Weight': '100 Kg',
      'Starter': 'no',
      'Wire': 'no',
      'Gear Oil': 'EP 140 Synthetic oil (2LT)',
      'Warranty': '1 year warranty + 1 year Service warranty',
      'Country of Origin': 'MADE IN INDIA'
    },
    warranty: '1 Year Warranty + 1 Year Free Service',
    images: [
      '/images/products/Aerator sets/Aqualion/AQUA LION 2HP 4 Paddle Wheel Aerator Set.png',
      '/images/products/Aerator sets/Aqualion/AQUA LION 2HP 4 Paddle Wheel Aerator Set copy.png'
    ],
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'aqualion-pr20nb',
    slug: 'aqualion-2hp-4-paddle-pr20nb',
    name: 'AQUA LION 2HP 4 Paddle Wheel Aerator Set (PR 20 NB)',
    model: 'PR 20 NB',
    brand: 'aqualion',
    category: 'aerator-set',
    mrp: 35000,
    salePrice: 33999,
    features: [
      'Aqualion 2HP Heavy Duty Motor (ISO Certified)',
      'A3 Nylon Bevel Gearbox (106 RPM)',
      'SS 304 Frame',
      'Virgin HDPE Floats (7kg)',
      'Double Warranty'
    ],
    components: [
      { item: 'MOTOR', spec: '2HP Heavy Duty Motor ( iso certified ) - 3 Phase', quantity: 1 },
      { item: 'GEAR BOX', spec: 'A3 NYLON Bevel - 106 RPM', quantity: 1 },
      { item: 'FLOAT', spec: '7KG - Virgin HDPE (UV)', quantity: 3 },
      { item: 'MOULDING FAN', spec: '2.2 Kg APX - Virgin PPCP (UV)', quantity: 4 },
      { item: 'MOTOR COVER / DOOM', spec: 'HDPE Handle Dom', quantity: 1 },
      { item: 'STAINLESS-STEEL FRAME', spec: 'SS 304 CR Finishing - 9 Kg - 3 MM', quantity: 1 },
      { item: 'STAINLESS-STEEL FAN ROD', spec: 'SS 304 CR Finishing', quantity: 2 },
      { item: 'KITBOX', spec: 'BOLT & NUTS, RUBBERS, GLANDS, BUSH STAND', quantity: 1 },
      { item: 'STARTER', spec: 'no', quantity: 1 },
      { item: 'WIRE', spec: 'no', quantity: 1 },
      { item: 'GEAR OIL', spec: 'EP 140 Synthetic oil (2LT)', quantity: 1 },
      { item: 'WARRANTY', spec: '1 year warranty + 1 year Service warranty', quantity: '' },
    ],
    specifications: {
      'Product Name': 'AQUA LION 2HP 4 PADDLE WHEEL AERATOR SET',
      'Type of Aerator': 'Surface Floating paddle Aerator',
      'Usage / Application': 'Shrimp & Fish Farming Ponds Aeration',
      'Brand': 'AQUA LION',
      'Model number': 'PR 20 NB',
      'Motor Power': '2HP',
      'Motor Type': 'Heavy Duty Motor ( iso certified )',
      'Motor Phase': '3 Phase',
      'Voltage': '415 v',
      'Frequency': '50 Hz',
      'Gear Box Type': 'A3 NYLON Bevel',
      'Gear Box RPM': '106',
      'Gear Box & Motor material': 'Nylon Body & Powder Coating Motor Body',
      'Treatment Technique': 'Aeration System',
      'No. of Paddle': '4',
      'Fan & Float Material': 'Virgin PPCP (Fan) & Virgin HDPE (Float)',
      'Fan Weight': '2.2 Kg APX',
      'Float Weight': '7KG',
      'Dom Type': 'HDPE Handle Dom',
      'Frame & Rod Material': 'SS 304 CR Finishing',
      'Frame Weight': '9 Kg',
      'Frame Thickness': '3 MM',
      'Visible Flow': '30 - 35 meters',
      'Effective Flow / Circulation Range': '35 - 40 meters',
      'Oxygen Generation': '3.0 - 3.2 Kg O2 / Hour',
      'Power Consumption': '1.6 - 1.8 Units / Hour',
      'Installation Services Available': 'NO',
      'Maintenance': 'LOW COST',
      'Water Depth Suitable': '3 - 5 Feet',
      'Pond Coverage': '0.75 - 1 acre',
      'Automation Grade': 'Automatic',
      'Power Source': 'Electric',
      'Total Set Weight': '98 Kg',
      'Starter': 'no',
      'Wire': 'no',
      'Gear Oil': 'EP 140 Synthetic oil (2LT)',
      'Warranty': '1 year warranty + 1 year Service warranty',
      'Country of Origin': 'MADE IN INDIA'
    },
    warranty: '1 Year Warranty + 1 Year Free Service',
    images: ['/images/products/Aerator sets/Aqualion/AQUA LION 2HP 4 Paddle Wheel Aerator Set.png'],
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'aqualion-pr20cmb',
    slug: 'aqualion-2hp-4-paddle-pr20cmb',
    name: 'AQUA LION 2HP 4 Paddle Wheel Aerator Set (PR 20 CMB)',
    model: 'PR 20 CMB',
    brand: 'aqualion',
    category: 'aerator-set',
    mrp: 39000,
    salePrice: 35999,
    features: [
      'Complete Set with Starter & Wire',
      'Aqualion 2HP Heavy Duty Motor',
      'A3 Bevel Gearbox',
      '110kg Total Set Weight',
      'Double Warranty'
    ],
    components: [
      { item: 'MOTOR', spec: '2HP Heavy Duty Motor ( iso certified ) - 3 Phase', quantity: 1 },
      { item: 'GEAR BOX', spec: 'A3 Bevel - 106 RPM', quantity: 1 },
      { item: 'FLOAT', spec: '7KG - Virgin HDPE (UV)', quantity: 3 },
      { item: 'MOULDING FAN', spec: '2.2 Kg APX - Virgin PPCP (UV)', quantity: 4 },
      { item: 'MOTOR COVER / DOOM', spec: 'HDPE Handle Dom', quantity: 1 },
      { item: 'STAINLESS-STEEL FRAME', spec: 'SS 304 CR Finishing - 9 Kg - 3 MM', quantity: 1 },
      { item: 'STAINLESS-STEEL FAN ROD', spec: 'SS 304 CR Finishing', quantity: 2 },
      { item: 'KITBOX', spec: 'BOLT & NUTS, RUBBERS, GLANDS, BUSH STAND', quantity: 1 },
      { item: 'STARTER', spec: 'Aqua Lion D-Starter', quantity: 1 },
      { item: 'WIRE', spec: '1.5 Heavy cable wire', quantity: 1 },
      { item: 'GEAR OIL', spec: 'EP 140 Synthetic oil (2LT)', quantity: 1 },
      { item: 'WARRANTY', spec: '1 year warranty + 1 year Service warranty', quantity: '' },
    ],
    specifications: {
      'Product Name': 'AQUA LION 2HP 4 PADDLE WHEEL AERATOR SET',
      'Type of Aerator': 'Surface Floating paddle Aerator',
      'Usage / Application': 'Shrimp & Fish Farming Ponds Aeration',
      'Brand': 'AQUA LION',
      'Model number': 'PR 20 CMB',
      'Motor Power': '2HP',
      'Motor Type': 'Heavy Duty Motor ( iso certified )',
      'Motor Phase': '3 Phase',
      'Voltage': '415 v',
      'Frequency': '50 Hz',
      'Gear Box Type': 'A3 Bevel',
      'Gear Box RPM': '106',
      'Gear Box & Motor material': 'Cast iron Body with Powder Coating',
      'Treatment Technique': 'Aeration System',
      'No. of Paddle': '4',
      'Fan & Float Material': 'Virgin PPCP (Fan) & Virgin HDPE (Float)',
      'Fan Weight': '2.2 Kg APX',
      'Float Weight': '7KG',
      'Dom Type': 'HDPE Handle Dom',
      'Frame & Rod Material': 'SS 304 CR Finishing',
      'Frame Weight': '9 Kg',
      'Frame Thickness': '3 MM',
      'Visible Flow': '30 - 35 meters',
      'Effective Flow / Circulation Range': '35 - 40 meters',
      'Oxygen Generation': '3.0 - 3.2 Kg O2 / Hour',
      'Power Consumption': '1.6 - 2 Units / Hour',
      'Installation Services Available': 'NO',
      'Maintenance': 'LOW COST',
      'Water Depth Suitable': '3 - 5 Feet',
      'Pond Coverage': '0.75 - 1 acre',
      'Automation Grade': 'Automatic',
      'Power Source': 'Electric',
      'Total Set Weight': '110 Kg',
      'Starter': 'Aqua Lion D-Starter',
      'Wire': '1.5 Heavy cable wire',
      'Gear Oil': 'EP 140 Synthetic oil (2LT)',
      'Warranty': '1 year warranty + 1 year Service warranty',
      'Country of Origin': 'MADE IN INDIA'
    },
    warranty: '1 Year Warranty + 1 Year Free Service',
    images: ['/images/products/Aerator sets/Aqualion/AQUA LION 2HP 4 Paddle Wheel Aerator Set.png'],
    inStock: true,
    stockStatus: 'in-stock'
  },

  // Sea Boss Budget + Performance Sets
  {
    id: 'seaboss-hv13w',
    slug: 'seaboss-2hp-4-paddle-hv13w',
    name: 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set (HV-13-W)',
    model: 'HV - 13- W',
    brand: 'seaboss',
    category: 'aerator-set',
    mrp: 25000,
    salePrice: 23999,
    features: [
      '2HP Sea Boss 3-phase motor',
      'A2 WORM Gearbox',
      '6.2 kg Sea Boss floats',
    ],
    components: [
      { item: 'MOTOR', spec: '2HP Heavy Duty Motor - 3 Phase', quantity: 1 },
      { item: 'GEAR BOX', spec: 'A2 WORM - 105 RPM', quantity: 1 },
      { item: 'FLOAT', spec: '6.2 KG  APX - Virgin HDPE (UV)', quantity: 3 },
      { item: 'MOULDING FAN', spec: '1.9 Kg APX - Virgin PPCP (UV)', quantity: 4 },
      { item: 'MOTOR COVER / DOOM', spec: 'HDPE Side Grip Dom', quantity: 1 },
      { item: 'STAINLESS-STEEL FRAME', spec: 'SS 202 CR Finishing - 7.3 Kg - 2 MM', quantity: 1 },
      { item: 'STANLESS-STEEL FAN ROD', spec: 'SS 202 CR Finishing', quantity: 2 },
      { item: 'KITBOX', spec: 'BOLT & NUTS, RUBBERS, GLANDS, BUSH STAND', quantity: 1 },
      { item: 'STARTER', spec: 'no', quantity: 1 },
      { item: 'WIRE', spec: 'no', quantity: 1 },
      { item: 'GEAR OIL', spec: 'no', quantity: 1 },
      { item: 'WARRANTY', spec: '1 year warranty', quantity: '' },
    ],
    specifications: {
      'Product Name': 'SEA BOSS 4 PADDLE WHEEL AERATOR SET',
      'Type of Aerator': 'Surface Floating paddle Aerator',
      'Usage / Application': 'Shrimp & Fish Farming Ponds Aeration',
      'Brand': 'SEA BOSS',
      'Model number': 'HV 13 W',
      'Motor Power': '2HP',
      'Motor Type': 'Heavy Duty Motor',
      'Motor Phase': '3 Phase',
      'Voltage': '415 v',
      'Frequency': '50 Hz',
      'Gear Box Type': 'A2 WORM',
      'Gear Box RPM': '105',
      'Gear Box & Motor material': 'Cast Iron Body & Motor Body with POWDER COATING',
      'Treatment Technique': 'Aeration System',
      'No. of Paddle': '4',
      'Fan & Float Material': 'Virgin PPCP (Fan) & Virgin HDPE (Float)',
      'Fan Weight': '1.9 Kg APX',
      'Float Weight': '6.2 KG  APX',
      'Dom Type': 'HDPE Side Grip Dom',
      'Frame & Rod Material': 'SS 202 CR Finishing',
      'Frame Weight': '7.3 Kg',
      'Frame Thickness': '2 MM',
      'Visible Flow': '25 meters',
      'Effective Flow / Circulation Range': '30 meters',
      'Oxygen Generation': '2.3 - 2.6 Kg O2 / Hour',
      'Power Consumption': '1.6 - 1.8 Units / Hour',
      'Installation Services Available': 'NO',
      'Maintenance': 'HIGH COST',
      'Water Depth Suitable': '2 - 4 Feet',
      'Pond Coverage': '0.75 - 1 acre',
      'Automation Grade': 'Automatic',
      'Power Source': 'Electric',
      'Total Set Weight': '90 Kg',
      'Starter': 'no',
      'Wire': 'no',
      'Gear Oil': 'no',
      'Warranty': '1 year warranty',
      'Country of Origin': 'MADE IN INDIA'
    },
    images: [
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic.png',
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic 2.png'
    ],
    warranty: '1 Year Warranty',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-hv13b',
    slug: 'seaboss-2hp-4-paddle-hv13b',
    name: 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set (HV-13-B)',
    model: 'HV-13-B',
    brand: 'seaboss',
    category: 'aerator-set',
    mrp: 26500,
    salePrice: 25499,
    features: [
      '2HP Sea Boss 3-phase motor',
      'Sea Boss Bevel Gearbox',
      '6.2 kg Sea Boss floats',
    ],
    components: [
      { item: 'MOTOR', spec: '2HP Heavy Duty Motor - 3 Phase', quantity: 1 },
      { item: 'GEAR BOX', spec: 'A3 Bevel - 105 RPM', quantity: 1 },
      { item: 'FLOAT', spec: '6.2 KG Apx - Virgin HDPE (UV)', quantity: 3 },
      { item: 'MOULDING FAN', spec: '1.9 Kg APX - Virgin PPCP (UV)', quantity: 4 },
      { item: 'MOTOR COVER / DOOM', spec: 'HDPE Side Grip Dom', quantity: 1 },
      { item: 'STAINLESS-STEEL FRAME', spec: 'SS 202 CR Finishing - 7.3 Kg - 2 MM', quantity: 1 },
      { item: 'STAINLESS-STEEL FAN ROD', spec: 'SS 202 CR Finishing', quantity: 2 },
      { item: 'KITBOX', spec: 'BOLT & NUTS, RUBBERS, GLANDS, BUSH STAND', quantity: 1 },
      { item: 'STARTER', spec: 'no', quantity: 1 },
      { item: 'WIRE', spec: 'no', quantity: 1 },
      { item: 'GEAR OIL', spec: 'no', quantity: 1 },
      { item: 'WARRANTY', spec: '1 year warranty', quantity: '' },
    ],
    specifications: {
      'Product Name': 'SEA BOSS 2HP 4 PADDLE WHEEL AERATOR SET',
      'Type of Aerator': 'Surface Floating paddle Aerator',
      'Usage / Application': 'Shrimp & Fish Farming Ponds Aeration',
      'Brand': 'SEA BOSS',
      'Model number': 'HV 13 B',
      'Motor Power': '2HP',
      'Motor Type': 'Heavy Duty Motor',
      'Motor Phase': '3 Phase',
      'Voltage': '415 v',
      'Frequency': '50 Hz',
      'Gear Box Type': 'A3 Bevel',
      'Gear Box RPM': '105',
      'Gear Box & Motor material': 'Cast iron Body with 3 LAYERS Powder Coating',
      'Treatment Technique': 'Aeration System',
      'No. of Paddle': '4',
      'Fan & Float Material': 'Virgin PPCP (Fan) & Virgin HDPE (Float)',
      'Fan Weight': '1.9 Kg APX',
      'Float Weight': '6.2 KG Apx',
      'Dom Type': 'HDPE Side Grip Dom',
      'Frame & Rod Material': 'SS 202 CR Finishing',
      'Frame Weight': '7.3 Kg',
      'Frame Thickness': '2 MM',
      'Visible Flow': '25 meters',
      'Effective Flow / Circulation Range': '30 meters',
      'Oxygen Generation': '2.3 - 2.6 Kg O2 / Hour',
      'Power Consumption': '1.6 - 1.8 Units / Hour',
      'Installation Services Available': 'NO',
      'Maintenance': 'LOW COST',
      'Water Depth Suitable': '2 - 4 Feet',
      'Pond Coverage': '0.75 - 1 acre',
      'Automation Grade': 'Automatic',
      'Power Source': 'Electric',
      'Total Set Weight': '93 Kg',
      'Starter': 'no',
      'Wire': 'no',
      'Gear Oil': 'no',
      'Warranty': '1 year warranty',
      'Country of Origin': 'MADE IN INDIA'
    },
    images: [
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic.png',
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic 2.png'
    ],
    warranty: '1 Year Warranty',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-pr14w',
    slug: 'seaboss-2hp-4-paddle-pr14w',
    name: 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set (PR-14-W)',
    model: 'PR-14-W',
    brand: 'seaboss',
    category: 'aerator-set',
    mrp: 26500,
    salePrice: 24999,
    features: [
      '2HP Sea Boss high-efficiency motor',
      'A2 Worm Gearbox 105RPM',
      '6.5 kg Sea Boss floats',
    ],
    components: [
      { item: 'HEAVY DUTY MOTOR', spec: '2HP Heavy Duty Motor - 3 Phase', quantity: 1 },
      { item: 'WORM GEAR BOX', spec: 'A2 WORM - 105 RPM', quantity: 1 },
      { item: 'FLOAT', spec: '6.5 KG - Virgin HDPE (UV)', quantity: 3 },
      { item: 'MOULDING FAN', spec: '2 Kg - Virgin PPCP (UV)', quantity: 4 },
      { item: 'MOTOR COVER / DOOM', spec: 'HDPE Side Grip Dom', quantity: 1 },
      { item: 'STAINLESS-STEEL FRAME', spec: 'SS 202 CR Finishing - 8 Kg - 2.5 MM', quantity: 1 },
      { item: 'STAINLESS-STEEL FAN ROD', spec: 'SS 202 CR Finishing', quantity: 2 },
      { item: 'KITBOX', spec: 'BOLT & NUTS, RUBBERS, GLANDS, ROLL BUSH STAND', quantity: 1 },
      { item: 'STARTER', spec: 'no', quantity: 1 },
      { item: 'WIRE', spec: 'no', quantity: 1 },
      { item: 'GEAR OIL', spec: 'no', quantity: 1 },
      { item: 'WARRANTY', spec: '1 year warranty', quantity: '' },
    ],
    specifications: {
      'Product Name': 'SEA BOSS 2HP 4 PADDLE WHEEL AERATOR SET',
      'Type of Aerator': 'Surface Floating paddle Aerator',
      'Usage / Application': 'Shrimp & Fish Farming Ponds Aeration',
      'Brand': 'SEA BOSS',
      'Model number': 'PR 14 W',
      'Motor Power': '2HP',
      'Motor Type': 'Heavy Duty Motor',
      'Motor Phase': '3 Phase',
      'Voltage': '415 v',
      'Frequency': '50 Hz',
      'Gear Box Type': 'A2 WORM',
      'Gear Box RPM': '105',
      'Gear Box & Motor material': 'Cast Iron Body & Motor Body with POWDER COATING',
      'Treatment Technique': 'Aeration System',
      'No. of Paddle': '4',
      'Fan & Float Material': 'Virgin PPCP (Fan) & Virgin HDPE (Float)',
      'Fan Weight': '2 Kg',
      'Float Weight': '6.5 KG',
      'Dom Type': 'HDPE Side Grip Dom',
      'Frame & Rod Material': 'SS 202 CR Finishing',
      'Frame Weight': '8 Kg',
      'Frame Thickness': '2.5 MM',
      'Visible Flow': '30 meters',
      'Effective Flow / Circulation Range': '35 meters',
      'Oxygen Generation': '2.8 - 3.0 Kg O2 / Hour',
      'Power Consumption': '1.6 - 1.8 Units / Hour',
      'Installation Services Available': 'NO',
      'Maintenance': 'HIGH COST',
      'Water Depth Suitable': '3 - 5 Feet',
      'Pond Coverage': '0.75 - 1 acre',
      'Automation Grade': 'Automatic',
      'Power Source': 'Electric',
      'Total Set Weight': '95 Kg',
      'Starter': 'no',
      'Wire': 'no',
      'Gear Oil': 'no',
      'Warranty': '1 year warranty',
      'Country of Origin': 'MADE IN INDIA'
    },
    images: [
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic.png',
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic 2.png'
    ],
    warranty: '1 Year Warranty',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-pr14b',
    slug: 'seaboss-2hp-4-paddle-pr14b',
    name: 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set (PR-14-B)',
    model: 'PR-14-B',
    brand: 'seaboss',
    category: 'aerator-set',
    mrp: 28000,
    salePrice: 26499,
    features: [
      '2HP Sea Boss motor with improved cooling',
      'Sea Boss Bevel Gearbox',
      '6.2 kg Sea Boss floats',
    ],
    components: [
      { item: 'MOTOR', spec: '2HP Heavy Duty Motor - 3 Phase', quantity: 1 },
      { item: 'GEAR BOX', spec: 'A3 Bevel - 105 RPM', quantity: 1 },
      { item: 'FLOAT', spec: '6.5 KG - Virgin HDPE (UV)', quantity: 3 },
      { item: 'MOULDING FAN', spec: '2 Kg - Virgin PPCP (UV)', quantity: 4 },
      { item: 'MOTOR COVER / DOOM', spec: 'HDPE Side Grip Dom', quantity: 1 },
      { item: 'STAINLESS-STEEL FRAME', spec: 'SS 202 CR Finishing - 8 Kg - 2.5 MM', quantity: 1 },
      { item: 'STAINLESS-STEEL FAN ROD', spec: 'SS 202 CR Finishing', quantity: 2 },
      { item: 'KITBOX', spec: 'BOLT & NUTS, RUBBERS, GLANDS, ROLL BUSH STAND', quantity: 1 },
      { item: 'STARTER', spec: 'no', quantity: 1 },
      { item: 'WIRE', spec: 'no', quantity: 1 },
      { item: 'GEAR OIL', spec: 'no', quantity: 1 },
      { item: 'WARRANTY', spec: '1 year warranty', quantity: '' },
    ],
    specifications: {
      'Product Name': 'SEA BOSS 2HP 4 PADDLE WHEEL AERATOR SET',
      'Type of Aerator': 'Surface Floating paddle Aerator',
      'Usage / Application': 'Shrimp & Fish Farming Ponds Aeration',
      'Brand': 'SEA BOSS',
      'Model number': 'PR 14 B',
      'Motor Power': '2HP',
      'Motor Type': 'Heavy Duty Motor',
      'Motor Phase': '3 Phase',
      'Voltage': '415 v',
      'Frequency': '50 Hz',
      'Gear Box Type': 'A3 Bevel',
      'Gear Box RPM': '105',
      'Gear Box & Motor material': 'Cast iron Body with 3 LAYERS Powder Coating',
      'Treatment Technique': 'Aeration System',
      'No. of Paddle': '4',
      'Fan & Float Material': 'Virgin PPCP (Fan) & Virgin HDPE (Float)',
      'Fan Weight': '2 Kg',
      'Float Weight': '6.5 KG',
      'Dom Type': 'HDPE Side Grip Dom',
      'Frame & Rod Material': 'SS 202 CR Finishing',
      'Frame Weight': '8 Kg',
      'Frame Thickness': '2.5 MM',
      'Visible Flow': '30 meters',
      'Effective Flow / Circulation Range': '35 meters',
      'Oxygen Generation': '2.8 - 3.0 Kg O2 / Hour',
      'Power Consumption': '1.6 - 1.8 Units / Hour',
      'Installation Services Available': 'NO',
      'Maintenance': 'LOW COST',
      'Water Depth Suitable': '3 - 5 Feet',
      'Pond Coverage': '0.75 - 1 acre',
      'Automation Grade': 'Automatic',
      'Power Source': 'Electric',
      'Total Set Weight': '96 Kg',
      'Starter': 'no',
      'Wire': 'no',
      'Gear Oil': 'no',
      'Warranty': '1 year warranty',
      'Country of Origin': 'MADE IN INDIA'
    },
    images: [
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic.png',
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic 2.png'
    ],
    warranty: '1 Year Warranty',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-pr14bss',
    slug: 'seaboss-2hp-4-paddle-pr14bss',
    name: 'SEA BOSS 2HP 4 Paddle Wheel Aerator Set SS 304 Frame (PR 14 BSS)',
    model: 'PR 14 BSS',
    brand: 'seaboss',
    category: 'aerator-set',
    mrp: 29000,
    salePrice: 27499,
    features: [
      '2HP Sea Boss motor with improved cooling',
      'Sea Boss Bevel Gearbox',
      'SS 304 frame and rods',
    ],
    components: [
      { item: 'MOTOR', spec: '2HP Heavy Duty Motor - 3 Phase', quantity: 1 },
      { item: 'GEAR BOX', spec: 'A3 Bevel - 105 RPM', quantity: 1 },
      { item: 'FLOAT', spec: '6.5 KG - Virgin HDPE (UV)', quantity: 3 },
      { item: 'MOTOR COVER / DOOM', spec: 'HDPE Side Grip Dom', quantity: 1 },
      { item: 'MOULDING FAN', spec: '2 Kg - Virgin PPCP (UV)', quantity: 4 },
      { item: 'STAINLESS-STEEL FRAME', spec: 'SS 304 CR Finishing - 8 Kg - 2.5 MM', quantity: 1 },
      { item: 'STAINLESS-STEEL FAN ROD', spec: 'SS 304 CR Finishing', quantity: 2 },
      { item: 'KITBOX', spec: 'BOLT & NUTS, RUBBERS, GLANDS, ROLL BUSH STAND', quantity: 1 },
      { item: 'STARTER', spec: 'no', quantity: 1 },
      { item: 'WIRE', spec: 'no', quantity: 1 },
      { item: 'GEAR OIL', spec: 'no', quantity: 1 },
      { item: 'WARRANTY', spec: '1 year warranty', quantity: '' },
    ],
    specifications: {
      'Product Name': 'SEA BOSS 2HP 4 PADDLE WHEEL AERATOR SET',
      'Type of Aerator': 'Surface Floating paddle Aerator',
      'Usage / Application': 'Shrimp & Fish Farming Ponds Aeration',
      'Brand': 'SEA BOSS',
      'Model number': 'PR 14 BSS',
      'Motor Power': '2HP',
      'Motor Type': 'Heavy Duty Motor',
      'Motor Phase': '3 Phase',
      'Voltage': '415 v',
      'Frequency': '50 Hz',
      'Gear Box Type': 'A3 Bevel',
      'Gear Box RPM': '105',
      'Gear Box & Motor material': 'Cast iron Body with 3 LAYERS Powder Coating',
      'Treatment Technique': 'Aeration System',
      'No. of Paddle': '4',
      'Fan & Float Material': 'Virgin PPCP (Fan) & Virgin HDPE (Float)',
      'Fan Weight': '2 Kg',
      'Float Weight': '6.5 KG',
      'Dom Type': 'HDPE Side Grip Dom',
      'Frame & Rod Material': 'SS 304 CR Finishing',
      'Frame Weight': '8 Kg',
      'Frame Thickness': '2.5 MM',
      'Visible Flow': '30 meters',
      'Effective Flow / Circulation Range': '35 meters',
      'Oxygen Generation': '2.8 - 3.0 Kg O2 / Hour',
      'Power Consumption': '1.6 - 1.8 Units / Hour',
      'Installation Services Available': 'NO',
      'Maintenance': 'LOW COST',
      'Water Depth Suitable': '3 - 5 Feet',
      'Pond Coverage': '0.75 - 1 acre',
      'Automation Grade': 'Automatic',
      'Power Source': 'Electric',
      'Total Set Weight': '96 Kg',
      'Starter': 'no',
      'Wire': 'no',
      'Gear Oil': 'no',
      'Warranty': '1 year warranty',
      'Country of Origin': 'MADE IN INDIA'
    },
    images: [
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic.png',
      '/images/products/Aerator sets/Sea boss/Sea Boss Generic 2.png'
    ],
    warranty: '1 Year Warranty',
    inStock: true,
    stockStatus: 'in-stock'
  }
];


// ==========================================
// MOTORS
// ==========================================

export const motors: Product[] = [
  {
    id: 'aqualion-motor',
    slug: 'aqualion-2hp-motor',
    name: 'Aqualion Motor',
    brand: 'aqualion',
    category: 'motor',
    mrp: 12500,
    salePrice: 10899,
    features: [
      'ISO Certified Premium Motor for reliability & safety',
      'Double-Layer Protection (Epoxy Powder Coated)',
      'IP55 Protection against dust and water',
      'Optimized Rotor Design for high efficiency',
      'Premium Quality Bearings',
      'Duty S1: Runs efficiently 24/7'
    ],
    description: `Aqualion Motors are ISO Certified Premium Motors built for reliability, safety, and long-lasting performance.
    
    Key Features:
    • <b>Double-Layer Protection System:</b> High-Pressure Coating Body, Powder Coating, Epoxy Powder Primer, and Double-Coated Epoxy Finish tailored for excellent resistance against rust and corrosion.
    • <b>Premium Quality Bearings:</b> Ensures smooth operation and long-lasting durability.
    • <b>Optimized Rotor Design:</b> Reduces energy consumption, keeps the motor cool, and enhances overall efficiency.
    • <b>IP55 Protection:</b> Keeps motor safe from dust and water, perfect for aquaculture and factory applications.
    • <b>Duty (S1):</b> Runs efficiently 24/7 without overheating or loss of performance.`,
    images: ['/images/products/Products/Motors/Aqualion/Aqualion Motor .png'],
    specifications: {
      'Power (HP/KW)': '2.0 / 1.5',
      'Frame': '100',
      'Voltage': '415V',
      'Speed': '1440 RPM',
      'Insulation': "'B' Class",
      'Motor Body': 'Casting Body with Powder Coating',
      'Efficiency': '80%',
      'IP Rating': 'IP55',
      'Phase': '3',
      'Frequency': '50Hz',
      'Duty': 'S1'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-motor',
    slug: 'seaboss-2hp-motor',
    name: 'Sea Boss Motor',
    brand: 'seaboss',
    category: 'motor',
    mrp: 10500,
    salePrice: 9799,
    features: [
      'Genuine Sea Boss 2HP Motor',
      'Continuous Duty (S1) for 24/7 operation',
      'Class B Insulation',
      'IP55 Protection',
      'High Efficiency 3-Phase Design'
    ],
    description: `The Sea Boss 2HP Motor is designed for reliable performance in aquaculture and industrial applications.
    
    Key Specs:
    • <b>Power:</b> 2.0 HP / 1.5 KW
    • <b>Duty Cycle:</b> Continuous (S1) - Suitable for 24/7 operation without overheating.
    • <b>IP55 Rating:</b> Protected against dust and water jets.
    • <b>Insulation:</b> Class B for thermal protection.`,
    images: [
      '/images/products/Products/Motors/Sea boss/Sea Boss Motor .png',
      '/images/products/Products/Motors/Sea boss/SEA BOSS MOTOR  (1).png'
    ],
    specifications: {
      'Power (HP/KW)': '2.0 / 1.5',
      'Frame': '100',
      'Voltage': '415V',
      'Speed': '1440 RPM',
      'Insulation': "'B' Class",
      'Phase': '3',
      'Frequency': '50Hz',
      'Duty Cycle': 'Continuous (S1)',
      'IP Rating': 'IP55'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// GEARBOXES
// ==========================================

export const wormGearboxes: Product[] = [
  {
    id: 'a2-worm-gearbox',
    slug: 'a2-worm-gearbox-standard',
    name: 'A2 Worm Gearbox',
    brand: 'generic',
    category: 'worm-gearbox',
    mrp: 6300,
    salePrice: 5999,
    features: [
      'Universal 14:1 Ratio 2HP Gearbox',
      'Heavy Duty Cast Iron Housing',
      'Premium Phosphor Bronze Wheel',
      'High-Efficiency Taper Roller Bearings',
      'Hardened Steel Worm Shaft',
      'Leak-Proof Oil Seal Design'
    ],
    images: ['/images/products/Products/Gear boxes/Worm/A2 Worm .png'],
    specifications: {
      'Type': 'A2 Worm Gearbox',
      'Application': '2HP 4-Paddle Aerators',
      'Ratio': '14:1',
      'Input Speed': '1440 RPM',
      'Output Speed': '100 RPM',
      'Housing Material': 'High-Grade Cast Iron',
      'Worm Wheel': 'Phosphor Bronze (Pb)',
      'Worm Shaft': 'Hardened Alloy Steel',
      'Bearings': 'Heavy Duty Taper Roller',
      'Oil Capacity': '2.5 Liters (Recommended 90/140 Grade)',
      'Weight': '38 kg (Approx)',
      'Mounting': 'Standard Foot Mount'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'aqualion-a2-worm-gearbox',
    slug: 'aqualion-a2-worm-gearbox',
    name: 'Aqualion A2 Worm Gearbox',
    model: 'AQUA LION A2',
    brand: 'aqualion',
    category: 'worm-gearbox',
    mrp: 7000,
    salePrice: 6499,
    features: [
      'Premium AQUA LION A2 Worm Gearbox',
      '105 RPM Output Speed',
      'Heavy Duty Cast Iron Body',
      'SS 202 Shaft (28mm OD)',
      'Quality Bearings (6206, 30206, 6306)',
      'Smooth & Stable Drive'
    ],
    images: ['/images/products/Products/Gear boxes/Worm/Aqualion/Aqualion A2.png'],
    specifications: {
      'Model': 'AQUA LION A2',
      'Gear Type': 'Worm',
      'Power': '2 HP',
      'Speed (RPM)': '105',
      'Body Material': 'Cast Iron',
      'Shaft OD': '28 mm',
      'Shaft Material': 'SS 202',
      'Colour': 'Blue',
      'Bearing Sizes': '6206, 30206, 6306'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  }
];

export const bevelGearboxes: Product[] = [
  {
    id: 'aqualion-a3-bevel-gearbox',
    slug: 'aqualion-a3-bevel-gearbox',
    name: 'Aqualion A3 Bevel Gearbox',
    brand: 'aqualion',
    category: 'bevel-gearbox',
    mrp: 10500,
    salePrice: 9199,
    features: [
      '106 RPM High-Performance Gear',
      'Bevel Gear Type for smoother transmission',
      'Cast Iron Body with Powder Coating',
      'SS304 Shaft (25mm OD)',
      'Premium Bearings (6206, 6305, 6008)'
    ],
    images: ['/images/products/Products/Gear boxes/Bevel/Aqualion/Aqualion A3 .png'],
    specifications: {
      'RPM': '106',
      'Gear Type': 'Bevel',
      'Body': 'Cast Iron Body with Powder Coating',
      'Shaft OD': '25mm',
      'Shaft': 'SS304',
      'Color': 'Black',
      'Bearings': '6206, 6305, 6008'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-a3-bevel-gearbox',
    slug: 'seaboss-a3-bevel-gearbox',
    name: 'Sea Boss A3 Bevel Gearbox',
    brand: 'seaboss',
    category: 'bevel-gearbox',
    mrp: 8000,
    salePrice: 7499,
    features: [
      '105 RPM Optimized Speed',
      'Bevel Gear Type',
      'Cast Iron Body with 3 Layers of Powder Coating',
      'SS202 Shaft (28mm OD)',
      'Reliable Bearings (6206, 6205, 6008)'
    ],
    images: ['/images/products/Products/Gear boxes/Bevel/Sea Boss/Sea Boss A3.png'],
    specifications: {
      'RPM': '105',
      'Gear Type': 'Bevel',
      'Body': 'Cast Iron Body',
      'Protection': '3 Layers of Powder Coating',
      'Shaft OD': '28mm',
      'Shaft': 'SS202',
      'Color': 'Black',
      'Bearings Size': '6206, 6205, 6008'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'aqualion-a3-nylon-gearbox',
    slug: 'aqualion-a3-nylon-gearbox',
    name: 'Aqualion A3 Nylon Bevel Gearbox',
    model: 'AQUA LION A3 NYLON',
    brand: 'aqualion',
    category: 'bevel-gearbox',
    mrp: 9500,
    salePrice: 8799,
    features: [
      'Premium AQUA LION A3 Nylon Bevel Gearbox',
      '105 RPM Output Speed',
      'Lightweight Nylon Body',
      '3 Layers of Powder Coating Protection',
      'SS 202 Shaft (25mm OD)',
      'Quality Bearings (6206, 6205, 6008)'
    ],
    images: ['/images/products/Products/Gear boxes/Bevel/Aqualion/A3 Nylon.png'],
    specifications: {
      'Model': 'AQUA LION A3 NYLON',
      'RPM': '105',
      'Gear Type': 'Bevel',
      'Body': 'Nylon Body',
      'Protection': '3 Layers of Powder Coating',
      'Shaft OD': '25 mm',
      'Shaft Material': 'SS 202',
      'Colour': 'Blue',
      'Bearing Sizes': '6206, 6205, 6008'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'aqualion-a3-heavy-bevel-gearbox',
    slug: 'aqualion-a3-heavy-bevel-gearbox',
    name: 'Aqualion A3 Heavy Bevel Gearbox',
    model: 'AQUA LION A3 HEAVY',
    brand: 'aqualion',
    category: 'bevel-gearbox',
    mrp: 8800,
    salePrice: 8299,
    features: [
      'Premium AQUA LION A3 Heavy Bevel Gearbox',
      '105 RPM Output Speed',
      'Heavy Duty Cast Iron Body',
      '3 Layers of Powder Coating Protection',
      'SS 202 Shaft (25mm OD)',
      'Quality Bearings (6206, 6205, 6008)'
    ],
    images: ['/images/products/Products/Gear boxes/Bevel/Aqualion/aqua lion Jinhulong gearbox 2.png'],
    specifications: {
      'Model': 'AQUA LION A3 HEAVY',
      'RPM': '105',
      'Gear Type': 'Bevel',
      'Body': 'Cast Iron Body',
      'Protection': '3 Layers of Powder Coating',
      'Shaft OD': '25 mm',
      'Shaft Material': 'SS 202',
      'Colour': 'Blue',
      'Bearing Sizes': '6206, 6205, 6008'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'pn-a3-gearbox',
    slug: 'pn-a3-gearbox',
    name: 'PN A3 Gearbox',
    brand: 'generic',
    category: 'bevel-gearbox',
    mrp: 7500,
    salePrice: 6999,
    features: [
      '105 RPM Standard Speed',
      'Bevel Gear Type with Cast Iron Body',
      '2 Layers of Powder Coating',
      'SS 202 Shaft (28mm OD)',
      'Durable Bearings (6206, 6205, 6008)'
    ],
    images: ['/images/products/Products/Gear boxes/Bevel/Sea Boss/PN A3.png'],
    specifications: {
      'RPM': '105',
      'Gear Type': 'Bevel',
      'Body Material': 'Cast Iron',
      'Protection': '2 Layers of Powder Coating',
      'Shaft OD': '28mm',
      'Shaft Material': 'SS 202',
      'Color': 'Black',
      'Bearings Size': '6206, 6205, 6008'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// SPARES - MOTOR COVERS
// ==========================================

export const motorCovers: Product[] = [
  {
    id: 'handle-motor-cover',
    slug: 'handle-motor-cover',
    name: 'Handle Motor Cover',
    brand: 'generic',
    category: 'motor-cover',
    mrp: 750,
    salePrice: 649,
    features: [
      '100% Pure HDPE Material',
      'Handle Type for Easy Lifting',
      'Compatible with 1HP, 2HP & 3HP Aerators',
      'Splash-proof / Weather-resistant',
      'Integrated Air Vents for Cooling',
      '4-5 Years Lifespan'
    ],
    images: ['/images/products/Products/Aerator spares/Motor covers/Handle Motor Cover.png'],
    specifications: {
      'Product Name': 'AERATOR Dom',
      'Type': 'Handle Type',
      'Material': '100% Pure HDPE (High-Density Polyethylene)',
      'Usage': 'Paddle wheel aerators',
      'Compatibility': '1 HP, 2 HP, and 3 HP Paddle Wheel Aerators',
      'Water Resistance': 'Splash-proof / Weather-resistant',
      'Color': 'Dark blue',
      'Ventilation': 'Integrated air vents for cooling',
      'Life Span': '4-5 years (depending on material & usage)'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'standard-motor-cover',
    slug: 'standard-aerator-motor-cover',
    name: 'Standard Aerator Motor Cover',
    brand: 'generic',
    category: 'motor-cover',
    mrp: 600,
    salePrice: 499,
    features: [
      'Pure HDPE Material',
      'Compatible with 1HP, 2HP & 3HP Motors',
      'Splash-proof & Weather-resistant',
      'Integrated Air Vents for Motor Cooling',
      '3-5 Years Expected Lifespan'
    ],
    images: ['/images/products/Products/Aerator spares/Motor covers/Standard Motor Cover .png'],
    specifications: {
      'Product Name': 'Aerator Dom (Motor Cover)',
      'Material': 'Pure High-Density Polyethylene (HDPE)',
      'Application': 'Paddle Wheel Aerators',
      'Compatibility': '1 HP, 2 HP, and 3 HP Motors',
      'Water Resistance': 'Splash-proof & Weather-resistant',
      'Color': 'Blue',
      'Ventilation': 'Integrated Air Vents for Motor Cooling',
      'Expected Lifespan': '3-5 Years (Subject to environmental conditions)'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-motor-cover',
    slug: 'seaboss-motor-cover',
    name: 'Sea Boss Motor Cover',
    brand: 'seaboss',
    category: 'motor-cover',
    mrp: 700,
    salePrice: 599,
    features: [
      '100% Pure HDPE Material',
      'Compatible with 1HP, 2HP & 3HP Units',
      'Splash-proof & Weather-resistant',
      'Integrated Air Vents for Cooling',
      '4-5 Years Estimated Lifespan'
    ],
    images: ['/images/products/Products/Aerator spares/Motor covers/sea Boss motor cover.png'],
    specifications: {
      'Product Name': 'Sea Boss Dom',
      'Primary Material': '100% Pure HDPE (High-Density Polyethylene)',
      'Application': 'Paddle Wheel Aerator Motor Cover',
      'Compatibility': '1 HP, 2 HP, and 3 HP Units',
      'Environmental Protection': 'Splash-proof & Weather-resistant',
      'Thermal Management': 'Integrated Air Vents for Cooling',
      'Color': 'Dark Blue',
      'Estimated Life Span': '4-5 Years (Based on usage and exposure)'
    },
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// SPARES - FLOATS
// ==========================================

export const floats: Product[] = [
  {
    id: 'standard-float-6.2kg',
    slug: 'standard-float-6-2kg',
    name: 'Standard Float 6.2 KG',
    brand: 'generic',
    category: 'float',
    mrp: 1600,
    salePrice: 1449,
    weight: '6.2 kg',
    features: [
      'Virgin HDPE Material',
      '6.2 KG Weight (Approx)',
      '174 CM Length (5 Feet 8.5")',
      'High Buoyancy for 2HP Aerators',
      'UV Stabilized for Long Life'
    ],
    images: [
      '/images/products/Products/Aerator spares/Floats/Standard Float 6.2KG /Standard Float 6.2KG .png',
      '/images/products/Products/Aerator spares/Floats/Standard Float 6.2KG /Standard Float 6.2KG 2.png',
      '/images/products/Products/Aerator spares/Floats/Standard Float 6.2KG /Standard Float 6.2KG  copy.png',
      '/images/products/spares/floats/standard_float_6_2kg_3.png'
    ],
    specifications: {
      'Brand': 'STANDARD',
      'Material': 'HDPE Virgin',
      'Weight': '6.2 KG APX',
      'Color': 'BLUE',
      'Length': '174 CM (5 Feet 8.5")',
      'Width': '33.02 CM (13")',
      'Height': '20.32 CM (8")'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-float-6.5kg',
    slug: 'seaboss-float-6-5kg',
    name: 'Sea Boss Float 6.5 KG',
    brand: 'seaboss',
    category: 'float',
    mrp: 2000,
    salePrice: 1649,
    weight: '6.5 kg',
    features: [
      'Virgin HDPE Material',
      '6.5 KG Weight (Approx)',
      '174 CM Length (5 Feet 8.5")',
      'High Buoyancy for 2HP Aerators',
      'Dark Blue Color'
    ],
    images: [
      '/images/products/Products/Aerator spares/Floats/Sea Boss Float 6.5KG/Sea Boss Float 6.5KG.png',
      '/images/products/Products/Aerator spares/Floats/Sea Boss Float 6.5KG/Sea Boss Float 6.5KG_2.png',
      '/images/products/Products/Aerator spares/Floats/Sea Boss Float 6.5KG/Sea Boss Float 6.5KG(1).png',
      '/images/products/Products/Aerator spares/Floats/Sea Boss Float 6.5KG/Sea Boss Float 6.5KG(2).png'
    ],
    specifications: {
      'Brand': 'SEA BOSS',
      'Material': 'HDPE Virgin',
      'Weight': '6.5 KG APX',
      'Color': 'DARK BLUE',
      'Length': '174 CM (5 Feet 8.5")',
      'Width': '33.02 CM (13")',
      'Height': '20.32 CM (8")'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'aqualion-float-7kg',
    slug: 'aqualion-float-7kg',
    name: 'Aqualion Float 7 KG',
    brand: 'aqualion',
    category: 'float',
    mrp: 3900,
    salePrice: 2499,
    weight: '7 kg',
    features: [
      'Virgin HDPE Material',
      '7 KG Weight (Approx)',
      '174 CM Length (5 Feet 8.5")',
      'High Buoyancy for 2HP Aerators',
      'Dark Blue Color'
    ],
    images: [
      '/images/products/spares/floats/aqualion_float_7kg_1.png',
      '/images/products/spares/floats/aqualion_float_7kg_2.png',
      '/images/products/spares/floats/aqualion_float_7kg_3.png'
    ],
    specifications: {
      'Brand': 'AQUALION',
      'Material': 'HDPE Virgin',
      'Weight': '7 KG APX',
      'Color': 'DARK BLUE',
      'Length': '174 CM (5 Feet 8.5")',
      'Width': '33.02 CM (13")',
      'Height': '20.32 CM (8")'
    },
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// SPARES - FANS
// ==========================================

export const fans: Product[] = [
  {
    id: 'moulding-fan-2.1kg',
    slug: 'moulding-fan-2-1kg',
    name: 'Moulding Fan 2.1 KG',
    brand: 'generic',
    category: 'fan',
    mrp: 600,
    salePrice: 499,
    weight: '2.1 kg',
    features: [
      'Virgin PPCP Material',
      '2.1 KG Weight (Approx)',
      'Brass Bush for Durability',
      'Lemon Yellow Color',
      'Single Moulding Fan Type'
    ],
    images: ['/images/products/Products/Aerator spares/Fans/Moulding Fan 2.1KG .png'],
    specifications: {
      'Material': 'Virgin PPCP',
      'Weight': '2.1 KG APX',
      'Color': 'Lemon yellow',
      'Bush': 'BRASS',
      'Type': 'Single Moulding Fan'
    },
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// SPARES - FRAMES
// ==========================================

export const frames: Product[] = [
  {
    id: 'ss202-frame-7.3kg',
    slug: 'ss202-frame-7-3kg',
    name: '2HP SS 202 Frame (7.3 KG)',
    brand: 'generic',
    category: 'frame',
    mrp: 3000,
    salePrice: 2499,
    weight: '7.3 kg',
    features: [
      'High-Quality SS 202 Stainless Steel',
      '7.3 KG Heavy-Weight for Stability',
      'L Angle Design for Strength',
      'Designed for Long Working Hours',
      'Excellent Stability in Water'
    ],
    images: ['/images/products/Products/Aerator spares/Frames/2HP SS 202 Frame 7.2KG .png'],
    specifications: {
      'Material': 'SS 202 L Angle',
      'Weight': '7.3 KG',
      'Compatibility': '2HP Paddle Wheel Aerators',
      'Application': 'Heavy-duty water stability'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'ss202-frame-8kg',
    slug: 'ss202-frame-8kg',
    name: '2HP SS 202 Frame (8 KG)',
    brand: 'generic',
    category: 'frame',
    mrp: 3500,
    salePrice: 2899,
    weight: '8 kg',
    features: [
      'High-Quality SS 202 Stainless Steel',
      '8 KG Heavy-Weight for Extra Stability',
      'Minimizes Vibration & Shaking',
      'Better Load Distribution for Smooth Fan Rotation',
      'Designed for Long Working Hours'
    ],
    images: ['/images/products/Products/Aerator spares/Frames/2HP SS 202 Frame 8KG.png'],
    specifications: {
      'Material': 'SS 202 L Angle',
      'Weight': '8 KG',
      'Compatibility': '2HP Paddle Wheel Aerators',
      'Application': 'Heavy-duty water stability'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'ss304-frame-8kg',
    slug: 'ss304-frame-8kg',
    name: '2HP SS 304 Frame (8 KG)',
    brand: 'generic',
    category: 'frame',
    mrp: 4300,
    salePrice: 3399,
    weight: '8 kg',
    features: [
      'Premium SS 304 Stainless Steel',
      '8 KG Heavy-Weight for Extra Stability',
      'Minimizes Vibration & Shaking',
      'Better Load Distribution for Smooth Fan Rotation',
      'Designed for Long Working Hours'
    ],
    images: ['/images/products/Products/Aerator spares/Frames/2HP SS 304 Frame 8KG.png'],
    specifications: {
      'Material': 'SS 304 L Angle',
      'Weight': '8 KG',
      'Compatibility': '2HP Paddle Wheel Aerators',
      'Application': 'Heavy-duty water stability'
    },
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// SPARES - RODS
// ==========================================

export const rods: Product[] = [
  {
    id: 'ss202-rod',
    slug: 'ss202-rod-2hp',
    name: '2HP SS 202 Rod',
    brand: 'generic',
    category: 'rod',
    mrp: 850,
    salePrice: 749,
    features: [
      'SS 202 L Sleeve with Solid Iron Rod',
      '6.5 to 7 KG Weight',
      '25.4 MM Thickness / ~24 MM Diameter',
      '85 CM Length',
      'Precision Machined Smooth Surface',
      'High Strength & Corrosion Resistant'
    ],
    specifications: {
      'Product Name': 'Stainless Steel 202 Rod (2 HP Shaft)',
      'Material': 'SS 202 L Sleeve with Solid Iron Rod',
      'Weight': '6.5 to 7 KG',
      'Thickness': '25.4 MM',
      'Diameter': '~24 MM THK',
      'Length': '85 CM',
      'Finish': 'Precision machined, smooth surface',
      'Compatibility': '2HP Paddle Wheel Aerators'
    },
    images: ['/images/products/Products/Aerator spares/Rods/2HP SS 202 Rod .png'],
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'ss304-rod',
    slug: 'ss304-rod-2hp',
    name: '2HP SS 304 Rod',
    brand: 'generic',
    category: 'rod',
    mrp: 1150,
    salePrice: 999,
    features: [
      'SS 304 L Sleeve with Solid Iron Rod',
      '6.5 to 7 KG Weight',
      '25.4 MM Thickness',
      '85 CM Length',
      '100% Rust Proof (1.5mm Thick Sleeve)',
      'Very Heavy with Long Life'
    ],
    specifications: {
      'Product Name': 'Stainless Steel 304 Rod (2 HP Shaft)',
      'Material': 'SS 304 L Sleeve with Solid Iron Rod',
      'Weight': '6.5 to 7 KG',
      'Thickness': '25.4 MM',
      'Length': '85 CM',
      'Sleeve': '1.5 MM Thick SS 304L (100% Rust Proof)',
      'Compatibility': '2HP Paddle Wheel Aerators'
    },
    images: ['/images/products/Products/Aerator spares/Rods/2HP SS 304 Rod.png'],
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// SPARES - KIT BOXES
// ==========================================

export const kitBoxes: Product[] = [
  {
    id: 'standard-kit-box',
    slug: 'standard-kit-box',
    name: 'Sea Boss Standard Kit Box',
    brand: 'generic',
    category: 'kit-box',
    mrp: 1000,
    salePrice: 899,
    features: [
      'HV Bush Stand: 2 Nos',
      'Joint Rubber (Heavy): 2 Nos',
      'Glands & Bolts: 4 Nos',
      'SS Bolt, Nut & Washer: 32 Sets'
    ],
    specifications: {
      'HV Bush Stand': '2 Nos',
      'Joint Rubber (Heavy)': '2 Nos',
      'Glands & Bolts': '4 Nos',
      'SS Bolt, Nut & Washer': '32 Sets'
    },
    images: ['/images/products/Products/Aerator spares/Kit box/Standard Kit Box .png'],
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-kit-box',
    slug: 'seaboss-kit-box',
    name: 'Sea Boss Premium Kit Box',
    brand: 'seaboss',
    category: 'kit-box',
    mrp: 1200,
    salePrice: 999,
    features: [
      'Roll Bearing Bush Stand: 2 Nos',
      'Joint Rubber (Heavy): 2 Nos',
      'Glands & Bolts: 4 Nos',
      'SS Bolt, Nut & Washer: 32 Sets'
    ],
    specifications: {
      'Roll Bearing Bush Stand': '2 Nos',
      'Joint Rubber (Heavy)': '2 Nos',
      'Glands & Bolts': '4 Nos',
      'SS Bolt, Nut & Washer': '32 Sets'
    },
    images: ['/images/products/Products/Aerator spares/Kit box/Sea Boss Kit Box .png'],
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'aqualion-kit-box',
    slug: 'aqualion-kit-box',
    name: 'Aqualion Kit Box',
    brand: 'aqualion',
    category: 'kit-box',
    mrp: 2500,
    salePrice: 2199,
    features: [
      'AQUA LION Roll Bearing Bush Stand: 2 Nos',
      'Joint Rubber (Heavy): 2 Nos',
      'SS Glands & Bolts: 4 Nos',
      'SS Bolt, Nut & Washer: 32 Sets',
      'GEAR OIL: 2 LT'
    ],
    specifications: {
      'AQUA LION Roll Bearing Bush Stand': '2 Nos',
      'Joint Rubber (Heavy)': '2 Nos',
      'SS Glands & Bolts': '4 Nos',
      'SS Bolt, Nut & Washer': '32 Sets',
      'GEAR OIL': '2 LT'
    },
    images: ['/images/products/Products/Aerator spares/Kit box/AQUA LION KIT BOX .png'],
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// LONG ARM PRODUCTS
// ==========================================

export const longArmProducts: Product[] = [
  {
    id: 'aqua-torque-long-arm-gearbox',
    slug: 'aqua-torque-long-arm-gearbox',
    name: 'Aqua Torque GBH 200 Long Arm Gearbox',
    model: 'GBH 200',
    brand: 'generic',
    category: 'long-arm-gearbox',
    mrp: 10500,
    salePrice: 9799,
    features: [
      'High Torque Output with Bigger Reinforced Gears',
      'Energy Efficient – Low Amp Consumption',
      'Long-Lasting Durability for Continuous Use',
      'Zero Maintenance – Advanced Engineering',
      'Rust-Proof Coating for Saltwater Protection',
      'Heavy-Duty Design for Large-Scale Aerators'
    ],
    images: ['/images/products/Products/Long arm gearbox/Aqua Torque GBH 200.png'],
    specifications: {
      'Model': 'Aqua Torque GBH 200',
      'RPM': '120',
      'Type': 'LongArm Gearbox',
      'Brand': 'Aqua Torque',
      'Application': 'Large-scale aerators, paddle wheels, intensive aquaculture'
    },
    warranty: '1 Year',
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'standard-l-float-5kg',
    slug: 'standard-l-float-5kg',
    name: 'Standard L Float 5 KG',
    brand: 'generic',
    category: 'long-arm-spare',
    mrp: 1500,
    salePrice: 1449,
    weight: '5.1 kg',
    features: [
      'Virgin HDPE Material',
      '5.1 KG Weight (Approx)',
      'Blue Color',
      '5.3 Feet Length',
      'Longarm Type Float'
    ],
    images: [
      '/images/products/Products/Long arm spares/Standard L Float 5KG .png',
      '/images/products/Products/Long arm spares/Standard L Float 5KG  copy.png'
    ],
    specifications: {
      'Material': 'Virgin HDPE',
      'Weight': '5.1 APX',
      'Color': 'Blue',
      'Length': '5.3',
      'Type': 'Longarm'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'seaboss-l-float-5.5kg',
    slug: 'seaboss-l-float-5-5kg',
    name: 'Sea Boss L Float 5.5 KG',
    brand: 'seaboss',
    category: 'long-arm-spare',
    mrp: 1700,
    salePrice: 1499,
    weight: '5.5 kg',
    features: [
      'Virgin HDPE Material',
      '5.5 KG Weight (Approx)',
      'Dark Blue Color',
      '5.3 Feet Length',
      'Longarm Type Float'
    ],
    images: [
      '/images/products/Products/Long arm spares/Sea Boss L Float 5.5KG.png',
      '/images/products/Products/Long arm spares/Sea Boss L Float 5.5KG copy.png',
      '/images/products/Products/Long arm spares/Sea Boss L Float 5.5KG copy 2.png'
    ],
    specifications: {
      'Material': 'Virgin HDPE',
      'Weight': '5.5 APX',
      'Color': 'Dark Blue',
      'Length': '5.3',
      'Type': 'Longarm'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'long-arm-box',
    slug: 'long-arm-box',
    name: 'Long Arm Box',
    brand: 'generic',
    category: 'long-arm-spare',
    mrp: 150,
    salePrice: 129,
    features: [
      'Protection box for electrical connections'
    ],
    images: ['/images/products/Products/Long arm spares/Long Arm Box.png'],
    specifications: {
      'Type': 'Protection Box',
      'Use': 'Electrical Connections'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'long-arm-bush-stand',
    slug: 'long-arm-bush-stand',
    name: 'Long Arm Bush Stand',
    brand: 'generic',
    category: 'long-arm-spare',
    mrp: 70,
    salePrice: 49,
    features: [
      'Shaft support and alignment'
    ],
    images: ['/images/products/Products/Long arm spares/Long arm Bush stand.png'],
    specifications: {
      'Type': 'Bush Stand',
      'Function': 'Shaft Support & Alignment'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'height-bit',
    slug: 'height-bit',
    name: 'Height Bit',
    brand: 'generic',
    category: 'long-arm-spare',
    mrp: 20,
    salePrice: 9,
    features: [
      'Height and angle adjustment'
    ],
    images: ['/images/products/Products/Long arm spares/Height Bit.png'],
    specifications: {
      'Type': 'Height Bit',
      'Function': 'Height & Angle Adjustment'
    },
    inStock: true,
    stockStatus: 'in-stock'
  },
  {
    id: 'heavy-molding-fan',
    slug: 'heavy-molding-fan',
    name: 'Heavy Molding Fan',
    brand: 'generic',
    category: 'long-arm-spare',
    mrp: 600,
    salePrice: 499,
    weight: '2.1 kg',
    features: [
      'Virgin PPCP Material',
      '2.1 KG Weight (Approx)',
      'Lemon Yellow Color with Brass Bush',
      'Creates More Water Flow & Spread',
      '80mm Deep Performance for More DO',
      'Crack & Impact Resistant Design',
      'Smooth Surface for Long-Term Performance'
    ],
    images: ['/images/products/Products/Long arm spares/Heavy Moulding Fan .png'],
    specifications: {
      'Material': 'Virgin PPCP',
      'Weight': '2.1 KG APX',
      'Color': 'Lemon yellow',
      'Bush': 'BRASS',
      'Type': 'Single Moulding Fan'
    },
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// WARRANTIES
// ==========================================

export const warranties: Product[] = [
  {
    id: 'seaboss-extended-warranty',
    slug: 'seaboss-1year-extended-warranty',
    name: 'Sea Boss 1-Year Extended Warranty',
    brand: 'seaboss',
    category: 'warranty',
    mrp: 1999,
    salePrice: 999,
    features: [
      'Extends replacement warranty by 1 year',
      'Valid only for Sea Boss Aerator Sets',
      'Must be purchased with the set'
    ],
    specifications: {
      'Type': 'Extended Warranty',
      'Duration': '1 Additional Year',
      'Coverage': 'Piece-to-Piece Replacement',
      'Eligibility': 'Sea Boss Sets Only'
    },
    images: [],
    inStock: true,
    stockStatus: 'in-stock'
  }
];

// ==========================================
// COMBINED EXPORTS
// ==========================================

export const allGearboxes = [...wormGearboxes, ...bevelGearboxes];

export const allSpares = [
  ...motorCovers,
  ...floats,
  ...fans,
  ...frames,
  ...rods,
  ...kitBoxes
];

export const allProducts: Product[] = [
  ...aeratorSets,
  ...motors,
  ...allGearboxes,
  ...allSpares,
  ...longArmProducts,
  ...warranties
];

// Helper functions
export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find(p => p.slug === slug);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return allProducts.filter(p => p.category === category);
}

export function getProductsByBrand(brand: Brand): Product[] {
  return allProducts.filter(p => p.brand === brand);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

export function calculateSavings(mrp: number, salePrice: number): number {
  return mrp - salePrice;
}

export function calculateDiscount(mrp: number, salePrice: number): number {
  return Math.round(((mrp - salePrice) / mrp) * 100);
}
