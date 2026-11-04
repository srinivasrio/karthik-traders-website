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

// Top catalog product card images to warm cache in idle time without blocking UI
const CATALOG_CARD_IMAGES = [
  '/images/products/Aerator sets/Aqualion/AQUA LION 2HP 4 Paddle Wheel Aerator Set.png',
  '/images/products/Aerator sets/Sea boss/Sea Boss Generic.png',
  '/images/products/Products/Motors/Aqualion/Aqualion Motor .png',
  '/images/products/Products/Motors/Sea boss/Sea Boss Motor .png',
  '/images/products/Products/Gear boxes/Worm/Aqualion/Aqualion A2.png',
  '/images/products/Products/Gear boxes/Bevel/Aqualion/Aqualion A3 .png',
  '/images/products/seaboss-a3-bevel-gearbox.png',
  '/images/products/Products/Long arm gearbox/Aqua Torque GBH 200.png',
  '/images/products/Products/Aerator spares/Motor covers/Handle Motor Cover.png',
  '/images/products/Products/Aerator spares/Floats/Standard Float 6.2KG /Standard Float 6.2KG .png',
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

      // 1. Prefetch tiny icons in idle time
      CRITICAL_ICONS.forEach((src) => {
        const img = new Image();
        img.src = src;
      });

      // 2. Prefetch primary card images in idle time
      CATALOG_CARD_IMAGES.forEach((src) => {
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
