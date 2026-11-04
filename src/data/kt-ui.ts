// Karthik Traders - UI configuration, design tokens & brand constants
export interface BrandMeta {
  label: string;
  tier: string;
  bg: string;
  fg: string;
  dot: string;
  logo?: string;
}

export const BRAND_CONFIG: Record<string, BrandMeta> = {
  aqualion: {
    label: 'Aqualion',
    tier: 'Premium',
    bg: '#FFF1D6',
    fg: '#8A4B00',
    dot: '#E8A317',
    logo: '/images/logos/aqualion-logo.svg',
  },
  seaboss: {
    label: 'Sea Boss',
    tier: 'Budget + High Performance',
    bg: '#DDF3FF',
    fg: '#0B5C86',
    dot: '#1BA3D9',
    logo: '/images/logos/seaboss-logo.svg',
  },
  'sea boss': {
    label: 'Sea Boss',
    tier: 'Budget + High Performance',
    bg: '#DDF3FF',
    fg: '#0B5C86',
    dot: '#1BA3D9',
    logo: '/images/logos/seaboss-logo.svg',
  },
  pn: { label: 'PN', tier: '', bg: '#EEF0F5', fg: '#3D4A63', dot: '#7C879C' },
  generic: { label: 'Generic', tier: '', bg: '#EEF0F5', fg: '#3D4A63', dot: '#7C879C' },
  other: { label: 'Custom/Other', tier: '', bg: '#EFE9FF', fg: '#5A3FB8', dot: '#8B6CF0' }
};

export function resolveBrandMeta(brand?: string, name?: string): BrandMeta {
  const b = (brand || '').toLowerCase().trim();
  const n = (name || '').toLowerCase();

  if (b.includes('aqualion') || b.includes('aqua lion') || n.includes('aqualion') || n.includes('aqua lion')) {
    return BRAND_CONFIG.aqualion;
  }
  if (b.includes('seaboss') || b.includes('sea boss') || n.includes('seaboss') || n.includes('sea boss')) {
    return BRAND_CONFIG.seaboss;
  }
  if (b.includes('pn') || n.includes('pn ')) {
    return BRAND_CONFIG.pn;
  }
  if (b && BRAND_CONFIG[b]) {
    return BRAND_CONFIG[b];
  }
  return {
    label: brand || 'Generic',
    tier: '',
    bg: '#EEF0F5',
    fg: '#3D4A63',
    dot: '#7C879C',
    logo: undefined,
  };
}

export const CONTACT_INFO = {
  sales: {
    name: 'Karthik',
    role: 'Sales & Bulk Inquiries',
    phone: '+91 86885 66023',
    rawPhone: '8688566023',
    tel: 'tel:+918688566023',
    wa: 'https://wa.me/918688566023'
  },
  support: {
    name: 'Hazarathaiah',
    role: 'Technical Support & Spares',
    phone: '+91 91776 57576',
    rawPhone: '9177657576',
    tel: 'tel:+919177657576',
    wa: 'https://wa.me/919177657576'
  },
  email: 'karthiktrader111@gmail.com',
  instagram: 'https://www.instagram.com/karthik_traders_1?xtok=MXFoOXJjbmt4eHh5dw==',
  facebook: 'https://www.facebook.com/share/1E2YvYdWZZ/',
  address: 'Opp. Madhura Sweets Line, Near MRF Tyres Line, Subedar Pet, Nellore, Andhra Pradesh 524001, India.',
  hours: 'Mon – Sat: 8:00 AM – 8:00 PM | Sun: 8:00 AM – 2:00 PM',
  mapEmbed: 'https://maps.google.com/maps?q=Karthik+Traders+Aquaculture+Nellore&t=&z=15&ie=UTF8&iwloc=&output=embed',
  directions: 'https://www.google.com/maps/dir/?api=1&destination=Karthik+Traders+Nellore',
  mapsUrl: 'https://share.google/KMiK7tY8aneqBFtPU',
  sharePlace: 'https://share.google/KMiK7tY8aneqBFtPU',
  dev: 'https://www.iamsrinivas.tech'
};

export const REVIEWS_DATA = [
  {
    name: 'DS FISHERS',
    rating: 5,
    text: 'Excellent service and quality',
    url: 'https://maps.app.goo.gl/ERWx5o99e91uzZgr7',
    avatar: '/images/reviewers/ds_fishers.png',
    initials: 'DS',
    bg: '#E8F9FF',
    line: '#C4D9FF',
    blob: '#C4D9FF',
    ink: '#1450C8'
  },
  {
    name: 'Yashmaster Yashmaster',
    rating: 5,
    text: 'Good quality and service',
    url: 'https://maps.app.goo.gl/M2rC5u6hqVPMSbNP9',
    initials: 'YY',
    bg: '#FFF4E3',
    line: '#FFDFB0',
    blob: '#FFE3B8',
    ink: '#D97706'
  },
  {
    name: 'Ayan Khan',
    rating: 5,
    text: 'I recently purchased sea boss aerator in karthik traders mainly I like the quality and price.',
    url: 'https://maps.app.goo.gl/1gkEeDRGDs2rdcMH8',
    initials: 'AK',
    bg: '#EEF6FD',
    line: '#C4D9FF',
    blob: '#DDF3FF',
    ink: '#0284C7'
  },
  {
    name: 'Srinivas Kumar Kollapudi',
    rating: 5,
    text: 'Very satisfied with the product quality and excellent service from Karthik Traders',
    url: 'https://maps.app.goo.gl/UJbNukcXJD5maY4j6',
    initials: 'SK',
    bg: '#F3F0FF',
    line: '#D8B4FE',
    blob: '#E9D5FF',
    ink: '#7C3AED'
  }
];

export const UI_CATEGORIES = {
  'aerator-sets': {
    title: 'Aerator Sets',
    lede: 'Complete paddle wheel aerators — 1HP 2-Paddle, 2HP 4-Paddle and 3HP 6-Paddle units with motor, gearbox, floats, fans and frame.',
    types: []
  },
  products: {
    title: 'Motors & Gearboxes',
    lede: 'ISO certified copper-wound motors, bevel and worm gearboxes for paddle wheel aerators.',
    types: ['Motors', 'Gearboxes']
  },
  spares: {
    title: 'Spares',
    lede: 'Floats, fans, motor covers, frames, fan rods and kit boxes — genuine spares for every set we sell.',
    types: ['Floats', 'Fans', 'Covers & Doms', 'Frames', 'Fan Rods', 'Kit Boxes']
  },
  'long-arm': {
    title: 'Long Arm',
    lede: 'Dual-shaft gearboxes, extended bush stands, height bits, clamps, couplings and extensions for long arm systems.',
    types: ['Gearboxes', 'Bush Stands', 'Height Bits', 'Clamps', 'Couplings', 'Extensions']
  }
};

export const COUPONS_STORE: Record<string, { type: 'percent' | 'flat'; value: number; min: number; label: string }> = {
  BULK5: { type: 'percent', value: 5, min: 50000, label: '5% off on orders above ₹50,000' },
  NELLORE1000: { type: 'flat', value: 1000, min: 20000, label: '₹1,000 off on orders above ₹20,000' }
};

export function formatPrice(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return '₹0';
  const val = typeof n === 'string' ? parseFloat(n.replace(/[^\d.]/g, '')) : n;
  if (isNaN(val)) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

export function getStockStatus(product: { inStock?: boolean; stock?: number; stockStatus?: string }) {
  if (product.inStock === false || product.stock === 0 || product.stockStatus === 'out-of-stock') {
    return 'out';
  }
  if ((product.stock !== undefined && product.stock > 0 && product.stock <= 6) || product.stockStatus === 'limited') {
    return 'low';
  }
  return 'in';
}
