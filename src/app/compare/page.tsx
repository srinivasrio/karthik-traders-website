'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { aeratorSets, Product } from '@/data/products';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';

// ─── Spec Lookup Helper ────────────────────────────────────────────────
/** Case-insensitive spec lookup; tries each key in order, returns first non-empty value. */
function getSpec(product: Product | null | undefined, ...keys: string[]): string {
  if (!product?.specifications) return '—';
  const entries = Object.entries(product.specifications);
  for (const k of keys) {
    for (const [pk, pv] of entries) {
      if (pk.toLowerCase() === k.toLowerCase() && pv) {
        if (typeof pv === 'object') return JSON.stringify(pv);
        const s = String(pv).trim();
        if (s) return s;
      }
    }
  }
  return '—';
}

// ─── Value Formatter & Structuring ─────────────────────────────────────
interface FormattedSpec {
  primary: string;
  secondary: string | null;
}

function formatSpecValue(raw: string | null | undefined): FormattedSpec {
  if (!raw || raw === '—' || raw.trim() === '') {
    return { primary: '—', secondary: null };
  }
  const str = raw.trim();

  // Direct normalizations
  if (/^made in india$/i.test(str)) return { primary: 'Made in India', secondary: null };
  if (/^(no|not included)$/i.test(str)) return { primary: 'Not Included', secondary: null };
  if (/^(yes|included)$/i.test(str)) return { primary: 'Included', secondary: null };
  if (/^low cost$/i.test(str) || /^low coast$/i.test(str)) return { primary: 'Low Maintenance', secondary: 'Economical Spares' };
  if (/^high cost$/i.test(str)) return { primary: 'Standard', secondary: 'Low Downtime' };
  if (/^automatic$/i.test(str)) return { primary: 'Automatic', secondary: null };
  if (/^electric$/i.test(str)) return { primary: 'Electric', secondary: null };
  if (/^(three phase|3 phase)$/i.test(str)) return { primary: '3 Phase', secondary: null };
  if (/^415\s*v$/i.test(str)) return { primary: '415 V', secondary: null };
  if (/^2\s*hp$/i.test(str)) return { primary: '2 HP', secondary: null };
  if (/^50\s*hz$/i.test(str)) return { primary: '50 Hz', secondary: null };
  if (/^50\s*[-–]\s*60\s*hz$/i.test(str)) return { primary: '50 – 60 Hz', secondary: null };

  // Gear Box & Motor Material
  if (/cast iron/i.test(str)) {
    if (/e\s*[-–]?\s*coating/i.test(str)) {
      return { primary: 'Cast Iron Body', secondary: 'Powder & E-Coating' };
    }
    if (/powder/i.test(str)) {
      return { primary: 'Cast Iron Body', secondary: 'Powder Coated' };
    }
    return { primary: 'Cast Iron Body', secondary: null };
  }
  if (/nylon/i.test(str)) {
    return { primary: 'Nylon / Cast Iron', secondary: 'Powder Coated' };
  }

  // Motor Type
  if (/heavy duty/i.test(str)) {
    if (/iso/i.test(str)) return { primary: 'Heavy Duty Motor', secondary: 'ISO Certified' };
    if (/jinhulong/i.test(str)) return { primary: 'Heavy Duty Motor', secondary: 'Jinhulong Type' };
    return { primary: 'Heavy Duty Motor', secondary: null };
  }

  // Fan & Float Material
  if (/virgin/i.test(str) && /float/i.test(str)) {
    return { primary: 'Virgin PP & HDPE', secondary: 'UV Stabilized' };
  }

  // Warranty
  if (/service warranty/i.test(str)) {
    return { primary: '1 Year Warranty', secondary: '+ 1 Year Service' };
  }
  if (/^1\s*year/i.test(str)) {
    return { primary: '1 Year', secondary: 'Standard Warranty' };
  }
  if (/^2\s*year/i.test(str)) {
    return { primary: '2 Years', secondary: 'Comprehensive' };
  }

  // Gear Oil
  if (/ep\s*140/i.test(str)) {
    return { primary: 'EP 140 Synthetic', secondary: '2 Liters' };
  }

  // Wire
  if (/heavy cable wire/i.test(str) || (/1\.5/i.test(str) && /wire/i.test(str))) {
    return { primary: '1.5 mm Heavy Duty', secondary: 'Copper Cable Wire' };
  }

  // Starter
  if (/starter/i.test(str)) {
    return { primary: 'L&T Type Starter', secondary: 'Heavy Duty OEM' };
  }

  // Dom Type
  if (/hdpe handle dom/i.test(str)) {
    return { primary: 'HDPE Dom', secondary: 'Handle Grip Type' };
  }
  if (/hdpe side grip dom/i.test(str)) {
    return { primary: 'HDPE Dom', secondary: 'Side Grip Type' };
  }

  // Type of Aerator
  if (/surface floating/i.test(str)) {
    return { primary: 'Surface Floating', secondary: 'Paddle Wheel Aerator' };
  }

  // Application
  if (/farming/i.test(str)) {
    return { primary: 'Shrimp & Fish Farming', secondary: 'Pond Aeration' };
  }

  // Gear Box RPM
  if (/^105/i.test(str)) {
    if (/a3/i.test(str)) return { primary: '105 RPM', secondary: '(A3 Ultra)' };
    return { primary: '105 RPM', secondary: null };
  }

  // Frame Material
  if (/ss\s*304/i.test(str)) return { primary: 'SS 304', secondary: 'CR Finishing' };
  if (/ss\s*202/i.test(str)) return { primary: 'SS 202', secondary: 'CR Finishing' };

  // Parentheses split: "HDPE (UV Resistant)" -> "HDPE", "(UV Resistant)"
  const parenMatch = str.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const p = parenMatch[1].trim();
    let s = parenMatch[2].trim();
    if (/^apx|approx$/i.test(s)) s = 'Approx';
    if (/^a3 ultra$/i.test(s)) s = 'A3 Ultra';
    if (/^iso certified$/i.test(s)) s = 'ISO Certified';
    if (/^uv resistant$/i.test(s)) s = 'UV Resistant';
    if (/^powder coated$/i.test(s)) s = 'Powder Coated';
    return { primary: p, secondary: `(${s})` };
  }

  // Thickness: 2 MM -> 2 mm
  const mmMatch = str.match(/^(\d+(\.\d+)?)\s*mm$/i);
  if (mmMatch) {
    return { primary: `${mmMatch[1]} mm`, secondary: null };
  }

  // Weight: 7 KG -> 7 kg, 7.3 Kg ( Apx ) -> 7.3 kg, (Approx)
  const kgMatch = str.match(/^(\d+(\.\d+)?)\s*kg/i);
  if (kgMatch) {
    const hasApx = /apx|approx/i.test(str);
    return { primary: `${kgMatch[1]} kg`, secondary: hasApx ? '(Approx)' : null };
  }

  // Power Consumption: 1.5 - 2 Units / Hour
  if (/units\s*[\/|per]\s*hour/i.test(str)) {
    const m = str.replace(/units\s*[\/|per]\s*hour/i, '').trim();
    return { primary: `${m} Units/hr`, secondary: null };
  }

  // Oxygen Generation: 3.0 - 3.2 Kg O2 / Hour
  if (/kg\s*o[2₂]\s*[\/|per]\s*hour/i.test(str)) {
    const m = str.replace(/kg\s*o[2₂]\s*[\/|per]\s*hour/i, '').trim();
    return { primary: `${m} kg O₂/hr`, secondary: 'Transfer Rate' };
  }

  // Aeration capacity / Pond coverage: 0.75 – 1 acre
  if (/acre/i.test(str)) {
    const m = str.replace(/acre[s]?/i, '').trim();
    return { primary: `${m} Acre`, secondary: null };
  }

  return { primary: str, secondary: null };
}

/** Formatted Spec Value View with bold primary text & structured subtext */
function FormattedValueView({ raw }: { raw: string }) {
  const { primary, secondary } = formatSpecValue(raw);

  if (primary === '—') {
    return <span className="text-slate-300 font-normal">—</span>;
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <span className="font-semibold text-[#1E293B] text-[11.5px] sm:text-[13px] md:text-sm tracking-tight leading-snug">
        {primary}
      </span>
      {secondary && (
        <span className="text-[9.5px] sm:text-[10.5px] md:text-[11.5px] text-[#64748B] font-medium leading-tight mt-0.5">
          {secondary}
        </span>
      )}
    </div>
  );
}

// ─── Comparison field definitions with display order ──────────────────
type IconType = 'bolt' | 'wave' | 'gear' | 'layers' | 'frame' | 'target' | 'shield' | 'droplet' | 'weight';

interface CompareField {
  label: string;
  keys: string[];
  icon: IconType;
  group: string;
}

const COMPARE_FIELDS: CompareField[] = [
  // ── Motor & Power ──
  { label: 'Motor Power', keys: ['Motor Power'], icon: 'bolt', group: 'Motor & Power' },
  { label: 'Motor Type', keys: ['Motor Type'], icon: 'bolt', group: 'Motor & Power' },
  { label: 'Motor Phase', keys: ['Motor Phase'], icon: 'bolt', group: 'Motor & Power' },
  { label: 'Voltage', keys: ['Voltage'], icon: 'bolt', group: 'Motor & Power' },
  { label: 'Frequency', keys: ['Frequency'], icon: 'bolt', group: 'Motor & Power' },
  { label: 'Power Consumption', keys: ['Power Consumption'], icon: 'bolt', group: 'Motor & Power' },
  { label: 'Power Source', keys: ['Power Source'], icon: 'bolt', group: 'Motor & Power' },
  { label: 'Starter', keys: ['Starter'], icon: 'bolt', group: 'Motor & Power' },
  { label: 'Cable Wire', keys: ['Wire'], icon: 'bolt', group: 'Motor & Power' },
  
  // ── Gear Box ──
  { label: 'Gear Box Type', keys: ['Gear Box Type'], icon: 'gear', group: 'Gear Box' },
  { label: 'Gear Box RPM', keys: ['Gear Box RPM'], icon: 'gear', group: 'Gear Box' },
  { label: 'Gear Box & Motor Material', keys: ['Gear Box & Motor material'], icon: 'gear', group: 'Gear Box' },
  { label: 'Gear Oil', keys: ['Gear oil', 'Gear Oil'], icon: 'gear', group: 'Gear Box' },
  
  // ── Paddles & Floats ──
  { label: 'No. of Paddles', keys: ['No. of Paddle'], icon: 'wave', group: 'Paddles & Floats' },
  { label: 'Fan & Float Material', keys: ['Fan & Float Material'], icon: 'layers', group: 'Paddles & Floats' },
  { label: 'Fan Weight', keys: ['Fan Weight'], icon: 'weight', group: 'Paddles & Floats' },
  { label: 'Float Weight', keys: ['Float Weight'], icon: 'weight', group: 'Paddles & Floats' },
  { label: 'Float & Dom Color', keys: ['Float & Dom Color'], icon: 'layers', group: 'Paddles & Floats' },
  { label: 'Dom Type', keys: ['Dom Type'], icon: 'layers', group: 'Paddles & Floats' },
  
  // ── Frame & Structure ──
  { label: 'Frame & Rod Material', keys: ['Frame & Rod Material'], icon: 'frame', group: 'Frame & Structure' },
  { label: 'Frame Weight', keys: ['Frame Weight'], icon: 'weight', group: 'Frame & Structure' },
  { label: 'Frame Thickness', keys: ['Frame Thickness', 'Frame thickness'], icon: 'frame', group: 'Frame & Structure' },
  { label: 'Total Set Weight', keys: ['Total Set Weight'], icon: 'weight', group: 'Frame & Structure' },
  
  // ── Performance ──
  { label: 'Oxygen Generation', keys: ['Oxygen Generation (Real)', 'Oxygen Generation'], icon: 'droplet', group: 'Performance' },
  { label: 'Visible Flow', keys: ['Visible Flow'], icon: 'wave', group: 'Performance' },
  { label: 'Circulation Range', keys: ['Effective Flow / Circulation Range'], icon: 'wave', group: 'Performance' },
  { label: 'Pond Coverage', keys: ['Pond Coverage'], icon: 'target', group: 'Performance' },
  { label: 'Water Depth', keys: ['Water Depth Suitable'], icon: 'droplet', group: 'Performance' },
  
  // ── General ──
  { label: 'Type of Aerator', keys: ['Type of Aerator'], icon: 'target', group: 'General' },
  { label: 'Usage / Application', keys: ['Usage / Application'], icon: 'target', group: 'General' },
  { label: 'Automation Grade', keys: ['Automation Grade'], icon: 'gear', group: 'General' },
  { label: 'Maintenance', keys: ['Maintenance', 'maintenance'], icon: 'shield', group: 'General' },
  { label: 'Installation Services', keys: ['Installation Services Available'], icon: 'shield', group: 'General' },
  { label: 'Warranty', keys: ['warranty', 'Warranty'], icon: 'shield', group: 'General' },
  { label: 'Country of Origin', keys: ['Country of Origin'], icon: 'shield', group: 'General' },
];

// Metadata keys to skip when scanning for extra specs
const SKIP_KEYS = new Set([
  'brand', 'category', 'components', 'features', 'model', 'warranty',
  'Product Name', 'Model number',
]);

// ─── SVG Icons ────────────────────────────────────────────────────────
function SpecIcon({ type }: { type: IconType }) {
  const cls = 'w-4 h-4 text-[#1D64EC] shrink-0';
  switch (type) {
    case 'bolt':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
    case 'wave':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.5c4-4 12-4 16 0M4 9.5c4-4 12-4 16 0" /></svg>;
    case 'gear':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83-2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case 'layers':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>;
    case 'frame':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2m12 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="10" height="10" rx="1" /></svg>;
    case 'target':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>;
    case 'shield':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" /></svg>;
    case 'droplet':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z" /></svg>;
    case 'weight':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
    default:
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /></svg>;
  }
}

// ─── Brand badge colors ──────────────────────────────────────────────
function getBrandBadge(brand: string | undefined) {
  const b = (brand || '').toLowerCase();
  if (b.includes('aqualion')) return { label: 'Premium', bg: 'bg-[#E0EFFF]', text: 'text-[#1D64EC]' };
  if (b.includes('seaboss') || b.includes('sea boss')) return { label: 'Budget', bg: 'bg-[#FFF3E6]', text: 'text-[#D97706]' };
  return { label: brand || '', bg: 'bg-gray-100', text: 'text-gray-600' };
}

// ─── Brand display name ──────────────────────────────────────────────
function getBrandName(product: Product | null | undefined): string {
  if (!product) return 'Aerator';
  const brand = (product.brand || '').toLowerCase();
  if (brand.includes('aqualion')) return 'Aqualion';
  if (brand.includes('seaboss') || brand.includes('sea boss')) return 'Sea Boss';
  return product.name?.split(' ')[0] || 'Aerator';
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================
function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products: liveAerators } = useLiveProducts(aeratorSets, { skipLoading: true });

  const aeratorList = useMemo(() => {
    return liveAerators.filter(
      (p) => p.category === 'aerator-set' || p.category === 'aerators'
    );
  }, [liveAerators]);

  // Default models matching the design
  const aqualionModel = useMemo(
    () => aeratorList.find((p) => p.brand === 'aqualion') || aeratorList[0],
    [aeratorList]
  );
  const seaBossModel = useMemo(
    () => aeratorList.find((p) => p.brand === 'seaboss') || aeratorList[1] || aeratorList[0],
    [aeratorList]
  );

  const [slugs, setSlugs] = useState<string[]>(['', '']);
  const [selectorSlot, setSelectorSlot] = useState<number | null>(null);
  const [showFullDetailsModal, setShowFullDetailsModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlP1 = searchParams.get('p1');
    const urlP2 = searchParams.get('p2');

    if (urlP1 || urlP2) {
      setSlugs([urlP1 || '', urlP2 || '']);
      return;
    }

    try {
      const stored = localStorage.getItem('kt_compare');
      if (stored) {
        const list: string[] = JSON.parse(stored);
        if (Array.isArray(list) && list.length >= 2 && list[0] && list[1]) {
          setSlugs([list[0], list[1]]);
          return;
        }
      }
    } catch {}

    if (aqualionModel && seaBossModel) {
      setSlugs([aqualionModel.slug, seaBossModel.slug]);
    }
  }, [searchParams, aqualionModel, seaBossModel]);

  const p1 = aeratorList.find((p) => p.slug === slugs[0]) || aqualionModel || null;
  const p2 = aeratorList.find((p) => p.slug === slugs[1]) || seaBossModel || null;

  const setSlot = (idx: number, slug: string) => {
    const next = [...slugs];
    next[idx] = slug;
    setSlugs(next);
    try {
      localStorage.setItem('kt_compare', JSON.stringify(next.filter(Boolean)));
      window.dispatchEvent(new CustomEvent('kt-store', { detail: 'kt_compare' }));
    } catch {}
    setSelectorSlot(null);
  };

  // ─── BUILD SPEC ROWS DYNAMICALLY FROM DB ──────────────────────────
  const specRows = useMemo(() => {
    const rows: { label: string; val1: string; val2: string; icon: IconType; group: string }[] = [];

    // 1. Add rows from ordered field definitions
    for (const field of COMPARE_FIELDS) {
      const v1 = getSpec(p1, ...field.keys);
      const v2 = getSpec(p2, ...field.keys);
      if (v1 !== '—' || v2 !== '—') {
        rows.push({ label: field.label, val1: v1, val2: v2, icon: field.icon, group: field.group });
      }
    }

    // 2. Catch extra specs from DB not covered by COMPARE_FIELDS
    const coveredKeys = new Set(COMPARE_FIELDS.flatMap((f) => f.keys.map((k) => k.toLowerCase())));
    const allKeys = new Map<string, string>();
    
    for (const p of [p1, p2]) {
      if (!p?.specifications) continue;
      for (const key of Object.keys(p.specifications)) {
        const lower = key.toLowerCase();
        if (!coveredKeys.has(lower) && !SKIP_KEYS.has(key) && !SKIP_KEYS.has(lower)) {
          if (!allKeys.has(lower)) allKeys.set(lower, key);
        }
      }
    }
    
    for (const [, originalKey] of allKeys) {
      const v1 = getSpec(p1, originalKey);
      const v2 = getSpec(p2, originalKey);
      if (v1 !== '—' || v2 !== '—') {
        rows.push({ label: originalKey, val1: v1, val2: v2, icon: 'target', group: 'Other' });
      }
    }

    return rows;
  }, [p1, p2]);

  // Group rows for the Full Details modal
  const groupedSpecs = useMemo(() => {
    const groups: { name: string; rows: typeof specRows }[] = [];
    const groupMap = new Map<string, typeof specRows>();
    for (const row of specRows) {
      const g = groupMap.get(row.group) || [];
      g.push(row);
      groupMap.set(row.group, g);
    }
    for (const [name, rows] of groupMap) {
      groups.push({ name, rows });
    }
    return groups;
  }, [specRows]);

  // Brand info
  const brand1 = getBrandBadge(p1?.brand);
  const brand2 = getBrandBadge(p2?.brand);
  const brandName1 = getBrandName(p1);
  const brandName2 = getBrandName(p2);

  // Product images
  const img1 = p1?.images?.[0] || '/assets/compare-aerator-pristine.jpg';
  const img2 = p2?.images?.[0] || '/assets/compare-aerator-pristine.jpg';

  // WhatsApp Quote Link
  const quoteText = encodeURIComponent(
    `Hello Karthik Traders, I would like to get a quote comparing:\n- ${p1?.name || 'Aqualion'}\n- ${p2?.name || 'Sea Boss'}\nfor my farm pond.`
  );
  const quoteUrl = `https://wa.me/919963840058?text=${quoteText}`;

  return (
    <div className="relative min-h-screen bg-[#EAF2FB] text-[#0B1A33] pb-12 md:pb-16 font-manrope overflow-hidden">
      {/* Background Ambient Pond Wallpaper */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image
          src="/new hero images/hero image desktop.png"
          alt="Aquaculture pond ambient background"
          fill
          priority
          className="object-cover object-center opacity-45 filter blur-[1.5px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#EAF2FB]/80 via-[#E4EFFB]/75 to-[#EAF2FB]/85" />
      </div>

      <main className="relative z-10 max-w-[1020px] mx-auto px-3 sm:px-6 lg:px-8 pt-2 md:pt-8">
        
        {/* Desktop Header Title */}
        <div className="hidden md:flex flex-col items-center text-center mb-7">
          <h1 className="text-3xl lg:text-4xl font-black font-poppins tracking-tight text-[#0A1931]">
            Compare <span className="text-[#1D64EC]">Aerators</span>
          </h1>
          <p className="text-sm lg:text-[15px] text-[#475569] font-medium mt-1.5 max-w-xl text-center">
            Choose the right aerator for your farm based on performance, features and value.
          </p>
        </div>

        {/* =========================================================================
            MAIN COMPARISON WHITE CARD
            ========================================================================= */}
        <div className="rounded-[28px] md:rounded-[32px] bg-white border border-[#E2E8F0]/80 shadow-[0_20px_50px_rgba(20,50,90,0.08)] p-3.5 sm:p-6 md:p-8 flex flex-col gap-5 md:gap-6">
          
          {/* Top Aerators Stage with "VS" Circle */}
          <div className="relative grid grid-cols-2 gap-2.5 sm:gap-6 items-stretch">
            {/* Floating "VS" badge */}
            <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-[0_4px_14px_rgba(29,100,236,0.18)] border border-slate-100 flex items-center justify-center">
                <span className="font-poppins font-black text-xs md:text-sm text-[#1D64EC] tracking-wider">
                  VS
                </span>
              </div>
            </div>

            {/* Left Product Card */}
            <div className="col-span-1 rounded-2xl bg-white border border-[#E8EFF8] p-2 sm:p-3 flex flex-col gap-2 relative shadow-2xs">
              <div className="relative aspect-[16/11] md:aspect-[16/9] w-full rounded-xl md:rounded-xl overflow-hidden bg-[#F0F6FC]">
                <Image
                  src={img1}
                  alt={p1?.name || 'Aerator 1'}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 45vw, 450px"
                  priority
                />
                <button
                  type="button"
                  onClick={() => setSelectorSlot(0)}
                  aria-label="Change model"
                  title="Switch aerator model"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/95 text-[#1D64EC] hover:bg-white flex items-center justify-center text-xs font-black shadow-xs cursor-pointer active:scale-95"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between gap-1 px-1 pt-0.5">
                <span className="font-poppins font-extrabold text-sm sm:text-lg md:text-xl text-[#0B1A33] tracking-tight">
                  {brandName1}
                </span>
                <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${brand1.bg} ${brand1.text} shrink-0`}>
                  {brand1.label}
                </span>
              </div>
            </div>

            {/* Right Product Card */}
            <div className="col-span-1 rounded-2xl bg-white border border-[#E8EFF8] p-2 sm:p-3 flex flex-col gap-2 relative shadow-2xs">
              <div className="relative aspect-[16/11] md:aspect-[16/9] w-full rounded-xl md:rounded-xl overflow-hidden bg-[#F0F6FC]">
                <Image
                  src={img2}
                  alt={p2?.name || 'Aerator 2'}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 45vw, 450px"
                  priority
                />
                <button
                  type="button"
                  onClick={() => setSelectorSlot(1)}
                  aria-label="Change model"
                  title="Switch aerator model"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/95 text-[#1D64EC] hover:bg-white flex items-center justify-center text-xs font-black shadow-xs cursor-pointer active:scale-95"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between gap-1 px-1 pt-0.5">
                <span className="font-poppins font-extrabold text-sm sm:text-lg md:text-xl text-[#0B1A33] tracking-tight">
                  {brandName2}
                </span>
                <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${brand2.bg} ${brand2.text} shrink-0`}>
                  {brand2.label}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              THE SPECIFICATION TABLE (DYNAMIC FROM DB, BOLD KEYS & STRUCTURED VALUES)
              ========================================================================= */}
          <div className="flex flex-col gap-1 w-full">
            {/* Desktop Table Header Row */}
            <div className="hidden md:grid grid-cols-12 py-3 px-5 text-sm font-bold text-[#0B1A33] border-b border-[#E2E8F0]/70 mb-1">
              <div className="col-span-4 text-xs uppercase tracking-wider text-[#64748B] font-bold flex items-center">
                Feature
              </div>
              <div className="col-span-4 text-center font-extrabold text-[#0B1A33] text-[15px]">
                {brandName1}
              </div>
              <div className="col-span-4 text-center font-extrabold text-[#0B1A33] text-[15px]">
                {brandName2}
              </div>
            </div>

            {/* Specification Rows */}
            {specRows.map((row, idx) => {
              const isTinted = idx % 2 === 0;

              return (
                <div
                  key={`${row.label}-${idx}`}
                  className={`w-full rounded-xl transition-colors ${
                    isTinted ? 'bg-[#F4F8FD]' : 'bg-white'
                  } hover:bg-[#EEF5FC]/70`}
                >
                  {/* Desktop Row View */}
                  <div className="hidden md:grid grid-cols-12 py-3.5 px-5 items-center text-sm">
                    {/* Col 1: Bold Key Label + Icon */}
                    <div className="col-span-4 flex items-center gap-3">
                      <SpecIcon type={row.icon} />
                      <span className="font-bold text-[#0B1A33] text-[13.5px] tracking-tight">
                        {row.label}
                      </span>
                    </div>

                    {/* Col 2: Product 1 Value (Structured & Centered) */}
                    <div className="col-span-4 flex items-center justify-center text-center px-2">
                      <FormattedValueView raw={row.val1} />
                    </div>

                    {/* Col 3: Product 2 Value (Structured & Centered) */}
                    <div className="col-span-4 flex items-center justify-center text-center px-2">
                      <FormattedValueView raw={row.val2} />
                    </div>
                  </div>

                  {/* Mobile Row View */}
                  <div className="md:hidden flex items-center py-2.5 px-3 text-[11px] sm:text-[12px] gap-1">
                    {/* Col 1: Bold Key Label + Icon (40% width) */}
                    <div className="w-[40%] flex items-center gap-2 shrink-0">
                      <SpecIcon type={row.icon} />
                      <span className="font-bold text-[#0B1A33] text-[11.5px] sm:text-xs leading-tight tracking-tight">
                        {row.label}
                      </span>
                    </div>

                    {/* Col 2: Product 1 Value (30% width) */}
                    <div className="w-[30%] flex items-center justify-center text-center px-0.5">
                      <FormattedValueView raw={row.val1} />
                    </div>

                    {/* Col 3: Product 2 Value (30% width) */}
                    <div className="w-[30%] flex items-center justify-center text-center px-0.5">
                      <FormattedValueView raw={row.val2} />
                    </div>
                  </div>
                </div>
              );
            })}

            {specRows.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-8">
                No specification data available for the selected aerators.
              </div>
            )}
          </div>

          {/* =========================================================================
              BOTTOM BUTTONS (MATCHING REFERENCE SCREENS)
              ========================================================================= */}
          {/* Desktop View: Centered Side-by-Side Pill Buttons */}
          <div className="hidden md:flex items-center justify-center gap-4 pt-2">
            <a
              href={quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-9 rounded-2xl bg-[#1D64EC] hover:bg-[#1554C8] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-11 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
              </svg>
              <span>Get Quote</span>
            </a>

            <button
              type="button"
              onClick={() => setShowFullDetailsModal(true)}
              className="h-11 px-9 rounded-2xl border border-[#CBD5E1] hover:border-[#1D64EC] bg-white text-[#1D64EC] font-bold text-sm flex items-center justify-center gap-2.5 hover:bg-[#F8FAFD] transition-all cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4 text-[#1D64EC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span>View Full Details</span>
            </button>
          </div>

          {/* Mobile View: Full Width Stacked Rounded-Full Buttons */}
          <div className="md:hidden flex flex-col gap-2.5 pt-1">
            <a
              href={quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-full bg-[#1D64EC] active:bg-[#1554C8] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-11 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
              </svg>
              <span>Get Quote</span>
            </a>

            <button
              type="button"
              onClick={() => setShowFullDetailsModal(true)}
              className="w-full h-12 rounded-full border border-[#CBD5E1] bg-white text-[#1D64EC] font-bold text-sm flex items-center justify-center gap-2 active:bg-[#F0F7FF] transition-all active:scale-98"
            >
              <svg className="w-4 h-4 text-[#1D64EC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span>View Details</span>
            </button>
          </div>

        </div>
      </main>

      {/* =========================================================================
          FULL DETAILS MODAL — Shows all specs grouped by category
          ========================================================================= */}
      {showFullDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="font-poppins font-black text-lg sm:text-xl text-[#0B1A33]">
                  Full Specifications
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete comparison: {p1?.name || 'Aerator 1'} vs {p2?.name || 'Aerator 2'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullDetailsModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Product Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 sm:p-4 rounded-2xl bg-[#F0F7FF] border border-[#C4D9FF]">
                <div className="font-extrabold text-[#1D64EC] text-xs sm:text-sm">{p1?.name || 'Aerator 1'}</div>
                <div className="text-[10px] sm:text-xs text-gray-600 mt-1 capitalize">{p1?.brand} • {getSpec(p1, 'Motor Power')}</div>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-[#FFF9F2] border border-[#FED7AA]">
                <div className="font-extrabold text-[#D97706] text-xs sm:text-sm">{p2?.name || 'Aerator 2'}</div>
                <div className="text-[10px] sm:text-xs text-gray-600 mt-1 capitalize">{p2?.brand} • {getSpec(p2, 'Motor Power')}</div>
              </div>
            </div>

            {/* Grouped Spec Sections */}
            {groupedSpecs.map((group) => (
              <div key={group.name} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-5 rounded-full bg-[#1D64EC]" />
                  <h4 className="font-poppins font-bold text-sm text-[#0B1A33]">{group.name}</h4>
                </div>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 bg-[#F8FAFD] border-b border-gray-100 text-[10px] sm:text-xs font-bold text-gray-700 px-3 sm:px-4 py-2">
                    <div>Specification</div>
                    <div className="text-center">{brandName1}</div>
                    <div className="text-center">{brandName2}</div>
                  </div>
                  {/* Rows */}
                  {group.rows.map((row, idx) => (
                    <div
                      key={`${row.label}-${idx}`}
                      className={`grid grid-cols-3 px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs items-center ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFCFF]'
                      } ${idx < group.rows.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <div className="font-bold text-[#0B1A33] flex items-center gap-1.5">
                        <SpecIcon type={row.icon} />
                        <span>{row.label}</span>
                      </div>
                      <div className="text-center flex items-center justify-center">
                        <FormattedValueView raw={row.val1} />
                      </div>
                      <div className="text-center flex items-center justify-center">
                        <FormattedValueView raw={row.val2} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Features Comparison */}
            {(p1?.features?.length || p2?.features?.length) && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-5 rounded-full bg-green-500" />
                  <h4 className="font-poppins font-bold text-sm text-[#0B1A33]">Key Features</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    {(p1?.features || []).map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] sm:text-xs text-gray-700">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {(p2?.features || []).map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] sm:text-xs text-gray-700">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Close Button */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullDetailsModal(false)}
                className="h-10 px-6 rounded-full bg-[#0B1A33] text-white text-xs font-bold hover:bg-[#1D64EC] transition-colors cursor-pointer"
              >
                Close Specification Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODEL SELECTION MODAL (WHEN USER CLICKS ✕)
          ========================================================================= */}
      {selectorSlot !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-poppins font-black text-lg text-[#0B1A33]">
                  Select Aerator for Slot {selectorSlot + 1}
                </h3>
                <p className="text-xs text-gray-500">
                  Pick any aerator set from Karthik Traders to compare
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectorSlot(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {aeratorList.map((item) => {
                const isSelected = slugs[selectorSlot] === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setSlot(selectorSlot, item.slug)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left border ${
                      isSelected
                        ? 'border-[#1D64EC] bg-[#EBF7FF]'
                        : 'border-gray-100 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-none">
                        <Image
                          src={item.images?.[0] || '/assets/compare-aerator-pristine.jpg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#0B1A33]">{item.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{item.brand} • {getSpec(item, 'Motor Power')}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[#1D64EC] font-bold text-sm">✓ Selected</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<SimpleLoadingScreen />}>
      <CompareContent />
    </Suspense>
  );
}
