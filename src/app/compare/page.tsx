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
  if (!product) return '—';
  for (const k of keys) {
    if (k.toLowerCase() === 'brand' && product.brand) {
      const b = product.brand.toLowerCase();
      if (b.includes('aqualion')) return 'Aqualion';
      if (b.includes('seaboss') || b.includes('sea boss')) return 'Sea Boss';
      return product.brand;
    }
  }
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

  // Brand
  if (/^aqualion$/i.test(str)) {
    return { primary: 'Aqualion', secondary: 'Premium Aeration' };
  }
  if (/^(seaboss|sea boss)$/i.test(str)) {
    return { primary: 'Sea Boss', secondary: 'High Performance' };
  }

  return { primary: str, secondary: null };
}

/** Formatted Spec Value View with regular normal weight values & structured subtext */
function FormattedValueView({ raw }: { raw: string }) {
  const { primary, secondary } = formatSpecValue(raw);

  if (primary === '—') {
    return <span className="text-slate-300 font-normal">—</span>;
  }

  const isAqualion = /aqualion/i.test(raw);
  const isSeaBoss = /seaboss|sea boss/i.test(raw);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="inline-flex items-center gap-2 justify-center">
        {isAqualion && (
          <img
            src="/images/logos/aqualion-logo.svg"
            alt="Aqualion"
            className="h-6 sm:h-7 w-auto object-contain shrink-0"
          />
        )}
        {isSeaBoss && (
          <img
            src="/images/logos/seaboss-logo.svg"
            alt="Sea Boss"
            className="h-6 sm:h-7 w-auto object-contain shrink-0"
          />
        )}
        <span className="font-normal text-[#1E293B] text-[11.5px] sm:text-[13px] md:text-sm tracking-tight leading-snug">
          {primary}
        </span>
      </div>
      {secondary && (
        <span className="text-[9.5px] sm:text-[10px] md:text-[11px] text-[#64748B] font-normal leading-tight mt-0.5">
          {secondary}
        </span>
      )}
    </div>
  );
}

// ─── Comparison field definitions with display order ──────────────────
type FeatureIcon =
  | 'model-number'
  | 'motor-power'
  | 'motor-type'
  | 'motor-phase'
  | 'voltage'
  | 'frequency'
  | 'power-consumption'
  | 'power-source'
  | 'starter'
  | 'cable-wire'
  | 'gearbox-type'
  | 'gearbox-rpm'
  | 'gearbox-material'
  | 'gear-oil'
  | 'paddles'
  | 'fan-float-material'
  | 'fan-weight'
  | 'float-weight'
  | 'color'
  | 'dom-type'
  | 'frame-material'
  | 'frame-weight'
  | 'frame-thickness'
  | 'total-weight'
  | 'oxygen-generation'
  | 'visible-flow'
  | 'circulation-range'
  | 'pond-coverage'
  | 'water-depth'
  | 'aerator-type'
  | 'usage'
  | 'automation'
  | 'maintenance'
  | 'installation'
  | 'warranty'
  | 'country'
  | 'treatment'
  | 'generic';

interface CompareField {
  label: string;
  keys: string[];
  icon: FeatureIcon;
  group: string;
}

const COMPARE_FIELDS: CompareField[] = [
  // ── Identification ──
  { label: 'Brand', keys: ['Brand', 'brand'], icon: 'country', group: 'Overview' },
  { label: 'Model Number', keys: ['Model number', 'Model Number', 'model'], icon: 'model-number', group: 'Overview' },

  // ── Motor & Power ──
  { label: 'Motor Power', keys: ['Motor Power'], icon: 'motor-power', group: 'Motor & Power' },
  { label: 'Motor Type', keys: ['Motor Type'], icon: 'motor-type', group: 'Motor & Power' },
  { label: 'Motor Phase', keys: ['Motor Phase'], icon: 'motor-phase', group: 'Motor & Power' },
  { label: 'Voltage', keys: ['Voltage'], icon: 'voltage', group: 'Motor & Power' },
  { label: 'Frequency', keys: ['Frequency'], icon: 'frequency', group: 'Motor & Power' },
  { label: 'Power Consumption', keys: ['Power Consumption'], icon: 'power-consumption', group: 'Motor & Power' },
  { label: 'Power Source', keys: ['Power Source'], icon: 'power-source', group: 'Motor & Power' },
  { label: 'Starter', keys: ['Starter'], icon: 'starter', group: 'Motor & Power' },
  { label: 'Cable Wire', keys: ['Wire'], icon: 'cable-wire', group: 'Motor & Power' },
  
  // ── Gear Box ──
  { label: 'Gear Box Type', keys: ['Gear Box Type'], icon: 'gearbox-type', group: 'Gear Box' },
  { label: 'Gear Box RPM', keys: ['Gear Box RPM'], icon: 'gearbox-rpm', group: 'Gear Box' },
  { label: 'Gear Box & Motor Material', keys: ['Gear Box & Motor material'], icon: 'gearbox-material', group: 'Gear Box' },
  { label: 'Gear Oil', keys: ['Gear oil', 'Gear Oil'], icon: 'gear-oil', group: 'Gear Box' },
  
  // ── Paddles & Floats ──
  { label: 'No. of Paddles', keys: ['No. of Paddle'], icon: 'paddles', group: 'Paddles & Floats' },
  { label: 'Fan & Float Material', keys: ['Fan & Float Material'], icon: 'fan-float-material', group: 'Paddles & Floats' },
  { label: 'Fan Weight', keys: ['Fan Weight'], icon: 'fan-weight', group: 'Paddles & Floats' },
  { label: 'Float Weight', keys: ['Float Weight'], icon: 'float-weight', group: 'Paddles & Floats' },
  { label: 'Float & Dom Color', keys: ['Float & Dom Color'], icon: 'color', group: 'Paddles & Floats' },
  { label: 'Dom Type', keys: ['Dom Type'], icon: 'dom-type', group: 'Paddles & Floats' },
  
  // ── Frame & Structure ──
  { label: 'Frame & Rod Material', keys: ['Frame & Rod Material'], icon: 'frame-material', group: 'Frame & Structure' },
  { label: 'Frame Weight', keys: ['Frame Weight'], icon: 'frame-weight', group: 'Frame & Structure' },
  { label: 'Frame Thickness', keys: ['Frame Thickness', 'Frame thickness'], icon: 'frame-thickness', group: 'Frame & Structure' },
  { label: 'Total Set Weight', keys: ['Total Set Weight'], icon: 'total-weight', group: 'Frame & Structure' },
  
  // ── Performance ──
  { label: 'Oxygen Generation', keys: ['Oxygen Generation (Real)', 'Oxygen Generation'], icon: 'oxygen-generation', group: 'Performance' },
  { label: 'Visible Flow', keys: ['Visible Flow'], icon: 'visible-flow', group: 'Performance' },
  { label: 'Circulation Range', keys: ['Effective Flow / Circulation Range'], icon: 'circulation-range', group: 'Performance' },
  { label: 'Pond Coverage', keys: ['Pond Coverage'], icon: 'pond-coverage', group: 'Performance' },
  { label: 'Water Depth', keys: ['Water Depth Suitable'], icon: 'water-depth', group: 'Performance' },
  
  // ── General ──
  { label: 'Type of Aerator', keys: ['Type of Aerator'], icon: 'aerator-type', group: 'General' },
  { label: 'Usage / Application', keys: ['Usage / Application'], icon: 'usage', group: 'General' },
  { label: 'Automation Grade', keys: ['Automation Grade'], icon: 'automation', group: 'General' },
  { label: 'Maintenance', keys: ['Maintenance', 'maintenance'], icon: 'maintenance', group: 'General' },
  { label: 'Installation Services', keys: ['Installation Services Available'], icon: 'installation', group: 'General' },
  { label: 'Warranty', keys: ['warranty', 'Warranty'], icon: 'warranty', group: 'General' },
  { label: 'Country of Origin', keys: ['Country of Origin'], icon: 'country', group: 'General' },
];

const SKIP_KEYS = new Set([
  'category', 'components', 'features', 'model', 'warranty',
  'Product Name',
]);

/** Automatic fallback icon resolver for dynamic extra DB specs */
function getIconForLabel(label: string): FeatureIcon {
  const l = label.toLowerCase();
  if (l.includes('model')) return 'model-number';
  if (l.includes('motor power')) return 'motor-power';
  if (l.includes('motor type')) return 'motor-type';
  if (l.includes('motor phase') || l.includes('phase')) return 'motor-phase';
  if (l.includes('voltage')) return 'voltage';
  if (l.includes('frequency')) return 'frequency';
  if (l.includes('consumption')) return 'power-consumption';
  if (l.includes('power source')) return 'power-source';
  if (l.includes('starter')) return 'starter';
  if (l.includes('wire') || l.includes('cable')) return 'cable-wire';
  if (l.includes('gear box type') || l.includes('gear type')) return 'gearbox-type';
  if (l.includes('rpm') || l.includes('speed')) return 'gearbox-rpm';
  if (l.includes('gear box & motor material') || l.includes('body material') || l.includes('housing')) return 'gearbox-material';
  if (l.includes('oil')) return 'gear-oil';
  if (l.includes('paddle')) return 'paddles';
  if (l.includes('fan & float material') || l.includes('material')) return 'fan-float-material';
  if (l.includes('fan weight')) return 'fan-weight';
  if (l.includes('float weight')) return 'float-weight';
  if (l.includes('color') || l.includes('colour')) return 'color';
  if (l.includes('dom')) return 'dom-type';
  if (l.includes('frame & rod') || l.includes('rod') || l.includes('shaft')) return 'frame-material';
  if (l.includes('frame weight')) return 'frame-weight';
  if (l.includes('thickness') || l.includes('diameter')) return 'frame-thickness';
  if (l.includes('total set weight') || l.includes('set weight')) return 'total-weight';
  if (l.includes('oxygen')) return 'oxygen-generation';
  if (l.includes('visible flow') || l.includes('flow')) return 'visible-flow';
  if (l.includes('circulation') || l.includes('range')) return 'circulation-range';
  if (l.includes('pond') || l.includes('coverage')) return 'pond-coverage';
  if (l.includes('depth')) return 'water-depth';
  if (l.includes('type of aerator')) return 'aerator-type';
  if (l.includes('usage') || l.includes('application')) return 'usage';
  if (l.includes('automation')) return 'automation';
  if (l.includes('maintenance')) return 'maintenance';
  if (l.includes('installation')) return 'installation';
  if (l.includes('warranty')) return 'warranty';
  if (l.includes('origin') || l.includes('country')) return 'country';
  if (l.includes('treatment')) return 'treatment';
  return 'generic';
}

// ─── UNIQUE SVG ICONS FOR EVERY SINGLE FEATURE ────────────────────────
function SpecIcon({ type }: { type: FeatureIcon }) {
  const cls = 'w-4 h-4 text-[#1D64EC] shrink-0';
  switch (type) {
    case 'model-number':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case 'motor-power':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case 'motor-type':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="5" width="13" height="14" rx="2" />
          <path d="M17 9h3v6h-3" />
          <line x1="1" y1="12" x2="4" y2="12" />
          <line x1="8" y1="9" x2="8" y2="15" />
          <line x1="13" y1="9" x2="13" y2="15" />
        </svg>
      );
    case 'motor-phase':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6c3-3 6-3 9 0s6 3 9 0" />
          <path d="M2 12c3-3 6-3 9 0s6 3 9 0" />
          <path d="M2 18c3-3 6-3 9 0s6 3 9 0" />
        </svg>
      );
    case 'voltage':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 9l4 7 4-7" />
        </svg>
      );
    case 'frequency':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 12 6 12 9 4 12 20 15 9 18 15 22 12" />
        </svg>
      );
    case 'power-consumption':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3v4M15 3v4M6 7h12v3a6 6 0 0 1-6 6v4" />
        </svg>
      );
    case 'power-source':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="9" cy="12" r="1.5" fill="currentColor" />
          <circle cx="15" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'starter':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <circle cx="12" cy="8" r="2" fill="currentColor" />
          <line x1="12" y1="13" x2="12" y2="17" />
        </svg>
      );
    case 'cable-wire':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" />
          <path d="M4 12a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" />
          <path d="M4 5a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" />
        </svg>
      );
    case 'gearbox-type':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="3.5" />
          <path d="M8 2v2.5M8 11.5V14M2 8h2.5M11.5 8H14" />
          <circle cx="16" cy="16" r="2.5" />
          <path d="M16 11.5v2M16 18.5v2M11.5 16h2M18.5 16h2" />
        </svg>
      );
    case 'gearbox-rpm':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.34 17a10 10 0 1 1 17.32 0" />
          <path d="M12 14l3.5-3.5" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'gearbox-material':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h16l-2.5 10H6.5L4 8z" />
          <line x1="8.5" y1="13" x2="15.5" y2="13" />
        </svg>
      );
    case 'gear-oil':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v4M8 7h8v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7z" />
          <path d="M8 11h8M8 15h8" />
        </svg>
      );
    case 'paddles':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12" />
        </svg>
      );
    case 'fan-float-material':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case 'fan-weight':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 12c-2.5-4-5-5-8-5 0 5 3 8 8 5z" />
          <path d="M12 12c2.5 4 5 5 8 5 0-5-3-8-8-5z" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'float-weight':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v14M5 7l7-4 7 4" />
          <path d="M3 13l4-6 4 6a4 4 0 0 1-8 0zM13 13l4-6 4 6a4 4 0 0 1-8 0z" />
          <line x1="6" y1="21" x2="18" y2="21" />
        </svg>
      );
    case 'color':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".75" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".75" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".75" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".75" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.68 1.5-1.5 0-.38-.15-.74-.42-1.01-.27-.27-.43-.64-.43-1.04 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.97-4.48-9-10-9z" />
        </svg>
      );
    case 'dom-type':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 17h16" />
          <path d="M4 17c0-6 3.58-11 8-11s8 5 8 11" />
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'frame-material':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2m12 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
      );
    case 'frame-weight':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9h12a4 4 0 0 1 4 4v5a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-5a4 4 0 0 1 4-4z" />
          <path d="M8 9V6a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case 'frame-thickness':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 6H3M21 18H3" />
          <path d="M12 6v12M9 9l3-3 3 3M9 15l3 3 3-3" />
        </svg>
      );
    case 'total-weight':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="15" rx="3" />
          <circle cx="12" cy="13" r="3" />
          <path d="M12 13l2-2" />
          <path d="M9 3h6" />
        </svg>
      );
    case 'oxygen-generation':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="16" r="3" />
          <circle cx="15" cy="9" r="4" />
          <circle cx="17" cy="18" r="2" />
          <circle cx="8" cy="6" r="2" />
        </svg>
      );
    case 'visible-flow':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 19c3-1.5 6-1.5 9 0 3 1.5 6 1.5 9 0" />
          <path d="M12 14c-1-3-3-5-6-6M12 14c1-3 3-5 6-6" />
          <path d="M12 14V4" />
        </svg>
      );
    case 'circulation-range':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12C2 6.48 6.48 2 12 2" />
          <path d="M5 12a7 7 0 0 1 7-7" />
          <path d="M8 12a4 4 0 0 1 4-4" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <path d="M12 12l7 7" />
        </svg>
      );
    case 'pond-coverage':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
          <circle cx="15" cy="15" r="2" fill="currentColor" />
        </svg>
      );
    case 'water-depth':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7c4-2 8 2 12 0s6-2 8 0" />
          <path d="M12 7v14" />
          <path d="M9 11h6M10 15h4M9 19h6" />
          <path d="M9 20l3 3 3-3" />
        </svg>
      );
    case 'aerator-type':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 16h18l-2 4H5l-2-4z" />
          <path d="M8 16V8h8v8" />
          <circle cx="12" cy="8" r="2" />
        </svg>
      );
    case 'usage':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 16s4-5 10-5 10 5 10 5-4 5-10 5S2 16 2 16z" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
          <path d="M2 16l-1-2 3 1M2 16l-1 2 3-1" />
        </svg>
      );
    case 'automation':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M9 9h6v6H9z" />
          <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" />
        </svg>
      );
    case 'maintenance':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case 'installation':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 4l5 5L8 21H3v-5L15 4z" />
          <path d="M18 7l-2-2" />
        </svg>
      );
    case 'warranty':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l7 3v6c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V5l7-3z" />
          <path d="M12 7l1 2 2.5.5-2 1.5.5 2.5-2-1-2 1 .5-2.5-2-1.5 2.5-.5z" fill="currentColor" />
        </svg>
      );
    case 'country':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.6 9h16.8M3.6 15h16.8" />
          <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
        </svg>
      );
    case 'treatment':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 1-9 9m9-9h-4m4 0l-3-3m-9 12a9 9 0 0 1-9-9m9 9v-4m0 4l-3-3M3 12a9 9 0 0 1 9-9m-9 9h4m-4 0l3 3m9-12a9 9 0 0 1 9 9m-9-9v4m0-4l3 3" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
  }
}

// ─── Brand badge colors & official logos ─────────────────────────────
function getBrandInfo(brand: string | undefined) {
  const b = (brand || '').toLowerCase();
  if (b.includes('aqualion')) {
    return {
      label: 'Aqualion',
      tag: 'PREMIUM',
      bg: 'bg-[#FFF4D2]',
      text: 'text-[#B87000]',
      border: 'border-[#FFE799]',
      logo: '/images/logos/aqualion-logo.svg',
    };
  }
  if (b.includes('seaboss') || b.includes('sea boss')) {
    return {
      label: 'Sea Boss',
      tag: 'HIGH PERFORMANCE',
      bg: 'bg-[#E8F1FF]',
      text: 'text-[#1450C8]',
      border: 'border-[#CDE0FF]',
      logo: '/images/logos/seaboss-logo.svg',
    };
  }
  return {
    label: brand || 'Aerator',
    tag: '',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    logo: null,
  };
}

// ─── Brand display name ──────────────────────────────────────────────
function getBrandName(product: Product | null | undefined): string {
  if (!product) return '';
  const brand = (product.brand || '').toLowerCase();
  if (brand.includes('aqualion')) return 'Aqualion';
  if (brand.includes('seaboss') || brand.includes('sea boss')) return 'Sea Boss';
  return product.name?.split(' ')[0] || 'Aerator';
}

// ─── Extract prominent aerator model number ─────────────────────────
function getAeratorModelNumber(product: Product | null | undefined): string {
  if (!product) return '—';
  const m =
    product.specifications?.['Model number'] ||
    product.specifications?.['Model Number'] ||
    product.model ||
    product.name?.match(/\(([^)]+)\)/)?.[1];
  return (m || product.name || '—').trim();
}

// ─── Subtitle helper matching user design ────────────────────────────
function getAeratorSubtitle(product: Product): string {
  const brand = (product.brand || '').toLowerCase().includes('aqualion') ? 'AQUA LION' : 'SEA BOSS';
  const hp = product.specifications?.['Motor Power'] || '2HP';
  const paddles = product.specifications?.['No. of Paddle'] || '4';
  const frame = product.specifications?.['Frame & Rod Material'] || product.specifications?.['Frame Material'] || '';
  const ssGrade = frame.includes('304') ? 'SS 304' : 'SS 202';
  return `${brand} ${hp} ${paddles} PADDLE WHEEL AERATOR SET ( ${ssGrade} )`;
}

// ─── Price helper ────────────────────────────────────────────────────
function getAeratorPrices(product: Product) {
  const sale = Number(product.salePrice || product.mrp || 0);
  const mrp = Number(product.mrp || product.salePrice || 0);
  return { sale, mrp };
}

// =====================================================================
// SLOT CARD COMPONENT (Handles Filled Aerator Card & Empty + Button)
// =====================================================================
function SlotCard({
  product,
  slotIdx,
  onRemove,
  onSelect,
}: {
  product: Product | null;
  slotIdx: number;
  onRemove: (idx: number, e: React.MouseEvent) => void;
  onSelect: (idx: number) => void;
}) {
  // ── EMPTY STATE ──
  if (!product) {
    return (
      <div
        onClick={() => onSelect(slotIdx)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(slotIdx);
          }
        }}
        className="col-span-1 rounded-2xl md:rounded-3xl bg-white border-2 border-dashed border-[#CBD5E1] hover:border-[#1D64EC] hover:bg-[#F8FAFD] p-2.5 sm:p-4 flex flex-col gap-2 relative shadow-2xs transition-all cursor-pointer group"
      >
        {/* Aspect Ratio Box matching product photo container */}
        <div className="relative aspect-[16/11] md:aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#F8FAFD] group-hover:bg-[#F0F7FF] flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-colors">
          {/* Circular + button */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#CBD5E1] group-hover:border-[#1D64EC] text-[#1D64EC] group-hover:bg-[#1D64EC] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className="font-poppins font-bold text-xs sm:text-sm text-[#0B1A33] group-hover:text-[#1D64EC] transition-colors">
            Add Aerator
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#64748B] font-medium">
            Tap to select model
          </span>
        </div>

        {/* Bottom Action row */}
        <div className="flex items-center justify-center px-1 pt-0.5">
          <span className="w-full py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#EBF3FC] text-[#1D64EC] group-hover:bg-[#1D64EC] group-hover:text-white transition-colors text-center shadow-2xs">
            + Choose Aerator
          </span>
        </div>
      </div>
    );
  }

  // ── FILLED STATE ──
  const brandInfo = getBrandInfo(product.brand);
  const brandName = getBrandName(product);
  const modelNumber = getAeratorModelNumber(product);
  const img = product.images?.[0] || '/assets/compare-aerator-pristine.jpg';
  const { sale, mrp } = getAeratorPrices(product);

  return (
    <div className="col-span-1 rounded-2xl md:rounded-3xl bg-white border border-[#E8EFF8] p-2.5 sm:p-4 flex flex-col gap-2 relative shadow-2xs hover:shadow-xs transition-shadow">
      <div className="relative aspect-[16/11] md:aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-[#F0F6FC]">
        <Image
          src={img}
          alt={product.name || 'Aerator'}
          fill
          className="object-cover object-center"
          sizes="(max-width: 640px) 45vw, 450px"
          priority
        />
        {/* "✕" Remove Aerator Button */}
        <button
          type="button"
          onClick={(e) => onRemove(slotIdx, e)}
          aria-label={`Remove ${brandName}`}
          title="Remove aerator"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 text-slate-500 hover:text-red-600 hover:bg-white flex items-center justify-center text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          ✕
        </button>

        {/* Change model pill button */}
        <button
          type="button"
          onClick={() => onSelect(slotIdx)}
          aria-label={`Change aerator in slot ${slotIdx + 1}`}
          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#1D64EC] hover:bg-[#1D64EC] hover:text-white text-[10px] sm:text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          ⇄ Change
        </button>
      </div>

      {/* Brand Logo on Left, Brand Capsule on Right, Prominent Model Number */}
      <div className="flex flex-col gap-1 px-1 pt-1">
        <div className="flex items-center justify-between gap-2">
          {/* HUGE Logo on Left */}
          {brandInfo.logo ? (
            <img
              src={brandInfo.logo}
              alt={brandInfo.label}
              className="h-8 sm:h-10 md:h-12 w-auto max-w-[130px] sm:max-w-[160px] object-contain shrink-0"
            />
          ) : (
            <div />
          )}

          {/* Brand Capsule on Right (WITHOUT logo inside) */}
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs sm:text-[13px] font-black uppercase tracking-wider ${brandInfo.bg} ${brandInfo.text} ${brandInfo.border} border shrink-0 shadow-2xs`}
          >
            {brandInfo.label}
          </span>
        </div>

        {/* PROMINENT MODEL NUMBER */}
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <span className="font-poppins font-black text-base sm:text-xl md:text-2xl text-[#0A2540] tracking-tight">
            {modelNumber}
          </span>
          <div className="text-right">
            <span className="font-poppins font-black text-sm sm:text-base md:text-lg text-[#00A859]">
              ₹{sale.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [selectorBrand, setSelectorBrand] = useState<'all' | 'seaboss' | 'aqualion'>('all');

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
        if (Array.isArray(list) && list.length >= 2) {
          setSlugs([list[0] || '', list[1] || '']);
          return;
        }
      }
    } catch {}

    if (aqualionModel && seaBossModel) {
      setSlugs([aqualionModel.slug, seaBossModel.slug]);
    }
  }, [searchParams, aqualionModel, seaBossModel]);

  const p1 = slugs[0] ? aeratorList.find((p) => p.slug === slugs[0]) || null : null;
  const p2 = slugs[1] ? aeratorList.find((p) => p.slug === slugs[1]) || null : null;

  // Set selected model into slot
  const setSlot = (idx: number, slug: string) => {
    const next = [...slugs];
    next[idx] = slug;
    setSlugs(next);
    try {
      localStorage.setItem('kt_compare', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('kt-store', { detail: 'kt_compare' }));
    } catch {}
    setSelectorSlot(null);
  };

  // Remove aerator from slot (shows empty card with + button)
  const removeSlot = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = [...slugs];
    next[idx] = '';
    setSlugs(next);
    try {
      localStorage.setItem('kt_compare', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('kt-store', { detail: 'kt_compare' }));
    } catch {}
  };

  // ─── BUILD SPEC ROWS DYNAMICALLY FROM DB ──────────────────────────
  const specRows = useMemo(() => {
    const rows: { label: string; val1: string; val2: string; icon: FeatureIcon; group: string }[] = [];

    // 1. Add rows from ordered field definitions
    for (const field of COMPARE_FIELDS) {
      const v1 = p1 ? getSpec(p1, ...field.keys) : '—';
      const v2 = p2 ? getSpec(p2, ...field.keys) : '—';
      // If at least one product is loaded, only include rows where at least one has a value
      // If both are empty, show all COMPARE_FIELDS as preview
      if (!p1 && !p2) {
        rows.push({ label: field.label, val1: '—', val2: '—', icon: field.icon, group: field.group });
      } else if (v1 !== '—' || v2 !== '—') {
        rows.push({ label: field.label, val1: v1, val2: v2, icon: field.icon, group: field.group });
      }
    }

    // 2. Catch extra specs from DB not covered by COMPARE_FIELDS (when at least one product is active)
    if (p1 || p2) {
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
        const v1 = p1 ? getSpec(p1, originalKey) : '—';
        const v2 = p2 ? getSpec(p2, originalKey) : '—';
        if (v1 !== '—' || v2 !== '—') {
          rows.push({ label: originalKey, val1: v1, val2: v2, icon: getIconForLabel(originalKey), group: 'Other' });
        }
      }
    }

    return rows;
  }, [p1, p2]);

  const brandName1 = getBrandName(p1);
  const brandName2 = getBrandName(p2);

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

            {/* Left Product Card (Slot 1) */}
            <SlotCard
              product={p1}
              slotIdx={0}
              onRemove={removeSlot}
              onSelect={setSelectorSlot}
            />

            {/* Right Product Card (Slot 2) */}
            <SlotCard
              product={p2}
              slotIdx={1}
              onRemove={removeSlot}
              onSelect={setSelectorSlot}
            />
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
              <div className="col-span-4 text-center">
                {p1 ? (
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="font-poppins font-black text-base lg:text-lg text-[#0A2540] tracking-tight">
                      {getAeratorModelNumber(p1)}
                    </span>
                    <div className="inline-flex items-center gap-2">
                      {getBrandInfo(p1.brand).logo && (
                        <img
                          src={getBrandInfo(p1.brand).logo!}
                          alt={brandName1}
                          className="h-6 sm:h-7 w-auto object-contain shrink-0"
                        />
                      )}
                      <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider">
                        {brandName1}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectorSlot(0)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-[#1D64EC] bg-[#EBF3FC] hover:bg-[#D9EAFE] transition-colors cursor-pointer"
                  >
                    <span>+ Add Aerator</span>
                  </button>
                )}
              </div>
              <div className="col-span-4 text-center">
                {p2 ? (
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="font-poppins font-black text-base lg:text-lg text-[#0A2540] tracking-tight">
                      {getAeratorModelNumber(p2)}
                    </span>
                    <div className="inline-flex items-center gap-2">
                      {getBrandInfo(p2.brand).logo && (
                        <img
                          src={getBrandInfo(p2.brand).logo!}
                          alt={brandName2}
                          className="h-6 sm:h-7 w-auto object-contain shrink-0"
                        />
                      )}
                      <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider">
                        {brandName2}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectorSlot(1)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-[#1D64EC] bg-[#EBF3FC] hover:bg-[#D9EAFE] transition-colors cursor-pointer"
                  >
                    <span>+ Add Aerator</span>
                  </button>
                )}
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

        </div>
      </main>

      {/* =========================================================================
          MODEL SELECTION MODAL (REDESIGNED MATCHING USER'S SCREENSHOTS)
          - Mobile view: 2 column grid cards
          - Desktop view: 3 column grid cards
          - Prominently highlighted model number
          - Brand badges, subtitle, MRP and Sale Price
          ========================================================================= */}
      {selectorSlot !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#F8FAFD] rounded-[28px] md:rounded-[36px] max-w-4xl w-full border border-[#E2E8F0] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header Bar */}
            <div className="p-4 sm:p-6 pb-3 border-b border-[#E2E8F0] bg-white flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-poppins font-black text-lg sm:text-2xl text-[#0B1A33] tracking-tight">
                    Select Aerator
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#64748B] font-medium mt-0.5">
                    Pick an aerator model to compare all technical specifications
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectorSlot(null)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F1F5F9] hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors active:scale-95"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Brand Filter Tabs */}
              <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectorBrand('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectorBrand === 'all'
                      ? 'bg-[#0B1A33] text-white shadow-xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0B1A33]'
                  }`}
                >
                  All Models ({aeratorList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectorBrand('seaboss')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    selectorBrand === 'seaboss'
                      ? 'bg-[#1450C8] text-white shadow-xs'
                      : 'bg-[#E8F1FF] text-[#1450C8] border border-[#CDE0FF] hover:bg-[#D9EAFE]'
                  }`}
                >
                  <img
                    src="/images/logos/seaboss-logo.svg"
                    alt="Sea Boss"
                    className="h-5 sm:h-6 w-auto object-contain shrink-0"
                  />
                  <span>Sea Boss</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectorBrand('aqualion')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    selectorBrand === 'aqualion'
                      ? 'bg-[#B87000] text-white shadow-xs'
                      : 'bg-[#FFF4D2] text-[#B87000] border border-[#FFE799] hover:bg-[#FEEDBE]'
                  }`}
                >
                  <img
                    src="/images/logos/aqualion-logo.svg"
                    alt="Aqualion"
                    className="h-5 sm:h-6 w-auto object-contain shrink-0"
                  />
                  <span>Aqualion</span>
                </button>
              </div>
            </div>

            {/* Modal Cards Grid: 2 columns on mobile, 3 columns on desktop */}
            <div className="p-3.5 sm:p-6 overflow-y-auto max-h-[calc(92vh-140px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5">
                {aeratorList
                  .filter((item) => {
                    if (selectorBrand === 'all') return true;
                    return (item.brand || '').toLowerCase().includes(selectorBrand);
                  })
                  .map((item) => {
                    const isSelected = slugs[selectorSlot] === item.slug;
                    const otherSlotIdx = selectorSlot === 0 ? 1 : 0;
                    const isOtherSelected = slugs[otherSlotIdx] === item.slug;
                    const modelNumber = getAeratorModelNumber(item);
                    const subtitle = getAeratorSubtitle(item);
                    const { sale, mrp } = getAeratorPrices(item);
                    const isSeaBoss = (item.brand || '').toLowerCase().includes('seaboss');

                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => setSlot(selectorSlot, item.slug)}
                        className={`w-full rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-between text-center transition-all duration-200 cursor-pointer relative ${
                          isSelected
                            ? 'border-2 border-[#1D64EC] ring-2 ring-[#1D64EC]/25 bg-[#F0F6FF] shadow-md'
                            : isOtherSelected
                            ? 'border-2 border-amber-300 bg-amber-50/50 hover:border-amber-400'
                            : 'border-2 border-[#E2E8F0] hover:border-[#1D64EC]/60 bg-white hover:bg-slate-50/60 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        {/* Top Row: HUGE Logo on Left, Brand Capsule on Right (WITHOUT logo) */}
                        <div className="w-full flex items-center justify-between gap-2">
                          <div className="flex items-center">
                            {isSeaBoss ? (
                              <img
                                src="/images/logos/seaboss-logo.svg"
                                alt="Sea Boss"
                                className="h-8 sm:h-9 md:h-10 w-auto max-w-[105px] sm:max-w-[135px] object-contain shrink-0"
                              />
                            ) : (
                              <img
                                src="/images/logos/aqualion-logo.svg"
                                alt="Aqualion"
                                className="h-8 sm:h-9 md:h-10 w-auto max-w-[105px] sm:max-w-[135px] object-contain shrink-0"
                              />
                            )}
                          </div>

                          <div>
                            {isSeaBoss ? (
                              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-[#E8F1FF] text-[#1450C8] border border-[#CDE0FF] text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
                                SEA BOSS
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-[#FFF4D2] text-[#B87000] border border-[#FFE799] text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
                                AQUALION
                              </span>
                            )}
                          </div>
                        </div>

                        {/* PROMINENT MODEL NUMBER */}
                        <div className="font-poppins font-black text-xl sm:text-2xl md:text-[26px] text-[#0A2540] tracking-tight my-2">
                          {modelNumber}
                        </div>

                        {/* Subtitle (Desktop / Tablet view) */}
                        <div className="hidden sm:block text-[10px] sm:text-[11px] font-bold text-[#64748B] text-center uppercase tracking-wide leading-tight line-clamp-2 px-1 mb-2">
                          {subtitle}
                        </div>

                        {/* Pricing (MRP strikethrough & bold green price) */}
                        <div className="flex flex-col items-center justify-center mt-auto pt-1 w-full">
                          {mrp > sale && (
                            <span className="text-[10.5px] sm:text-xs text-[#64748B] line-through font-semibold leading-none">
                              MRP: ₹{mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="text-base sm:text-xl md:text-2xl font-black text-[#00A859] tracking-tight mt-1 leading-none">
                            ₹{sale.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Status Badges */}
                        {isSelected && (
                          <span className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-[#1D64EC] text-white shadow-2xs">
                            ✓ Selected
                          </span>
                        )}
                        {!isSelected && isOtherSelected && (
                          <span className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-amber-100 text-amber-800">
                            Compared
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
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
