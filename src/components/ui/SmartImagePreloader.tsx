'use client';

import { useEffect } from 'react';

// Lightweight essential menu and brand assets (<50KB total) for instant tap response
const CRITICAL_ICONS = [
  '/icons/menu/home.png',
  '/icons/menu/aerators.png',
  '/icons/menu/products.png',
  '/icons/menu/spares.png',
  '/icons/menu/long-arm.png',
  '/icons/menu/home-color.png',
  '/icons/menu/aerators-color.png',
  '/icons/menu/spares-color.png',
  '/icons/menu/long-arm-color.png',
  '/images/logos/aqualion-logo.png',
  '/images/logos/seaboss-logo.png',
];

export default function SmartImagePreloader() {
  useEffect(() => {
    const prefetchAssets = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn?.saveData || conn?.effectiveType === '2g') {
          return;
        }
      }

      // Prefetch tiny icons in idle time without blocking the network pipe
      CRITICAL_ICONS.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(prefetchAssets, { timeout: 4000 });
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(prefetchAssets, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
