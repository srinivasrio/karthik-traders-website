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
  '/icons/menu/home-color.png',
  '/icons/menu/aerators-color.png',
  '/icons/menu/spares-color.png',
  '/icons/menu/long-arm-color.png',
  '/assets/seaboss-trim.png',
  '/uploads/aqualion-logo.svg',
  // Top selling category visuals
  '/images/categories/aerator-sets-1.png',
  '/images/categories/motor-1.png',
  '/images/categories/gearbox-aqualion-a3.png',
  '/images/categories/long_arm_cat.png',
  '/images/categories/spares_cat.png',
  // All section catalog primary card images
  '/images/products/Aerator sets/Aqualion/AQUA LION 2HP 4 Paddle Wheel Aerator Set.png',
  '/images/products/Aerator sets/Sea boss/Sea Boss Generic.png',
  '/images/products/Products/Motors/Aqualion/Aqualion Motor .png',
  '/images/products/Products/Motors/Sea boss/Sea Boss Motor .png',
  '/images/products/Products/Gear boxes/Worm/A2 Worm .png',
  '/images/products/Products/Gear boxes/Worm/Aqualion/Aqualion A2.png',
  '/images/products/Products/Gear boxes/Bevel/Aqualion/Aqualion A3 .png',
  '/images/products/seaboss-a3-bevel-gearbox.png',
  '/images/products/Products/Gear boxes/Bevel/Aqualion/A3 Nylon.png',
  '/images/products/Products/Gear boxes/Bevel/Aqualion/aqua lion Jinhulong gearbox 2.png',
  '/images/products/Products/Gear boxes/Bevel/Sea Boss/PN A3.png',
  '/images/products/Products/Aerator spares/Motor covers/Handle Motor Cover.png',
  '/images/products/Products/Aerator spares/Motor covers/Standard Motor Cover .png',
  '/images/products/Products/Aerator spares/Motor covers/sea Boss motor cover.png',
  '/images/products/Products/Aerator spares/Floats/Standard Float 6.2KG /Standard Float 6.2KG .png',
  '/images/products/Products/Aerator spares/Floats/Sea Boss Float 6.5KG/Sea Boss Float 6.5KG.png',
  '/images/products/spares/floats/aqualion_float_7kg_1.png',
  '/images/products/Products/Aerator spares/Fans/Moulding Fan 2.1KG .png',
  '/images/products/Products/Aerator spares/Frames/2HP SS 202 Frame 7.2KG .png',
  '/images/products/Products/Aerator spares/Frames/2HP SS 202 Frame 8KG.png',
  '/images/products/Products/Aerator spares/Frames/2HP SS 304 Frame 8KG.png',
  '/images/products/Products/Aerator spares/Rods/2HP SS 202 Rod .png',
  '/images/products/Products/Aerator spares/Rods/2HP SS 304 Rod.png',
  '/images/products/Products/Aerator spares/Kit box/Standard Kit Box .png',
  '/images/products/Products/Aerator spares/Kit box/Sea Boss Kit Box .png',
  '/images/products/Products/Aerator spares/Kit box/AQUA LION KIT BOX .png',
  '/images/products/Products/Long arm gearbox/Aqua Torque GBH 200.png',
  '/images/products/Products/Long arm spares/Standard L Float 5KG .png',
  '/images/products/Products/Long arm spares/Sea Boss L Float 5.5KG.png',
  '/images/products/Products/Long arm spares/Long Arm Box.png',
  '/images/products/Products/Long arm spares/Long arm Bush stand.png',
  '/images/products/Products/Long arm spares/Height Bit.png',
  '/images/products/Products/Long arm spares/Heavy Moulding Fan .png'
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

