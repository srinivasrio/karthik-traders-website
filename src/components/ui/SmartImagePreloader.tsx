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

// Google Maps embed URL to preload in background after home visit
const GOOGLE_MAPS_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863.027005479426!2d79.98202027589998!3d14.444391280521633!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4cf3b5a1bbefef%3A0xe54d9c7bb7d530f6!2sKarthik%20Traders!5e0!3m2!1sen!2sin!4v1711200000000!5m2!1sen!2sin';

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

      // 1. Prefetch key product and menu images into browser cache
      PREFETCH_IMAGES.forEach((src) => {
        const img = new Image();
        img.src = src;
      });

      // 2. Preload Google Maps in background so it renders instantly when scrolled to bottom
      try {
        if (!document.getElementById('preload-google-maps')) {
          const mapIframe = document.createElement('iframe');
          mapIframe.id = 'preload-google-maps';
          mapIframe.src = GOOGLE_MAPS_EMBED;
          mapIframe.style.display = 'none';
          mapIframe.setAttribute('aria-hidden', 'true');
          mapIframe.tabIndex = -1;
          document.body.appendChild(mapIframe);
        }
      } catch (err) {
        // Ignore prefetch error
      }
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

