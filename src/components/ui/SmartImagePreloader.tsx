'use client';

import { useEffect } from 'react';

// Key high-priority assets for instant category navigation
const PREFETCH_IMAGES = [
  // Primary brand & menu icons
  '/icons/menu/home.png',
  '/icons/menu/aerators.png',
  '/icons/menu/products.png',
  '/icons/menu/spares.png',
  '/icons/menu/long-arm.png',
  '/assets/seaboss-trim.png',
  '/uploads/aqualion-logo.svg',
  // Top selling category visuals
  '/images/categories/aerator-sets-1.png',
  '/images/categories/motor-1.png',
  '/images/categories/gearbox-aqualion-a3.png',
  '/images/categories/long_arm_cat.png',
  '/images/categories/spares_cat.png',
];

export default function SmartImagePreloader() {
  useEffect(() => {
    // Wait until browser has finished critical initial rendering
    const prefetchAssets = () => {
      // Don't prefetch on very slow 2G connections or if user enabled Save-Data
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn?.saveData || conn?.effectiveType === '2g') {
          return;
        }
      }

      // Prefetch one image at a time during idle times without competing with page interactions
      PREFETCH_IMAGES.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(prefetchAssets, { timeout: 3000 });
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(prefetchAssets, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
