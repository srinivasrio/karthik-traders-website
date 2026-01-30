'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import HeroSection from '@/components/home/HeroSection';
import MapSection from '@/components/home/MapSection';
import ReviewsSection from '@/components/home/ReviewsSection';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import ContactForm from '@/components/home/ContactForm';

import { useState, useEffect } from 'react';

// Categories Section - Liquid Grid
// Categories Section - Liquid Grid
// Categories Section - Liquid Grid
import { AnimatePresence } from 'framer-motion';

function CategoryCard({ category }: { category: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (category.images.length <= 1) return;

    // Use explicit interval if provided, otherwise default to 3s
    const delay = category.interval || 3000;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % category.images.length);
    }, delay);
    return () => clearInterval(interval);
  }, [category.images.length, category.interval]);

  return (
    <Link
      href={category.href}
      className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-steel-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-103 aspect-[4/5] md:aspect-square relative overflow-hidden"
    >
      <div className="w-full flex-1 flex items-center justify-center mb-3 relative p-2 overflow-hidden">
        <AnimatePresence mode="wait">
          {category.images && category.images.length > 0 && (
            <motion.img
              key={currentIndex}
              src={category.images[currentIndex]}
              alt={category.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full object-contain drop-shadow-none absolute inset-0 p-2"
            />
          )}
        </AnimatePresence>

        {category.overlayIcon && (
          <motion.div
            className="z-20 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-white p-2"
            animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut"
            }}
          >
            <img
              src={category.overlayIcon}
              alt="Call us"
              className="w-full h-full object-contain"
            />
          </motion.div>
        )}
      </div>

      <span className="text-sm font-bold text-deep-blue-900 text-center leading-tight group-hover:text-aqua-700 transition-colors z-10">
        {category.name}
      </span>
    </Link>
  );
}

function CategoriesSection() {
  const categories = [
    {
      name: 'Aerator Sets',
      href: '/aerator-sets',
      interval: 2500,
      images: [
        '/images/categories/aerator_sets_cat.png',
        '/images/categories/aerator-sets-1.png'
      ]
    },
    {
      name: 'Motors',
      href: '/products?category=motors',
      interval: 4500,
      images: [
        '/images/categories/motors_cat.png',
        '/images/categories/motor-1.png'
      ]
    },
    {
      name: 'Gear Boxes',
      href: '/products?category=gearboxes',
      interval: 3500,
      images: [
        '/images/categories/gearboxes_cat.png',
        '/images/categories/gearbox-aqualion-a3.png',
        '/images/categories/gearbox-pn-a3.png'
      ]
    },
    {
      name: 'Spares',
      href: '/spares',
      interval: 1800,
      images: [
        '/images/categories/spares_cat.png',
        '/images/categories/spares-float-standard.png',
        '/images/categories/spares-fan-moulding.png',
        '/images/categories/spares-kit-box.png',
        '/images/categories/spares-rod-2hp.png',
        '/images/categories/spares-frame-2hp.png'
      ]
    },
    {
      name: 'Long Arm',
      href: '/long-arm',
      interval: 2000,
      images: [
        '/images/categories/long_arm_cat.png',
        '/images/categories/longarm-bush-stand.png',
        '/images/categories/longarm-box.png',
        '/images/categories/longarm-height-bit.png',
        '/images/categories/longarm-fan-heavy.png',
        '/images/categories/longarm-float-seaboss.png'
      ]
    },
    {
      name: 'Bulk Order',
      href: '/#contact',
      interval: 6000,
      images: [],
      overlayIcon: '/images/call_icon.jpg'
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <section className="py-8 bg-white border-t border-steel-50">
      <div className="container-custom px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-deep-blue-900 mb-1">
            Explore Categories
          </h2>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-3 gap-4 mx-auto max-w-lg"
        >
          {categories.map((category) => (
            <motion.div key={category.name} variants={item as any}>
              <CategoryCard category={category} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Trust Highlights Section - Glass Style
// Trust Highlights Section - Animated Slideshow
function TrustHighlightsSection() {
  const highlights = [
    {
      icon: '🔧',
      title: 'Spares Available',
      desc: 'All parts in stock',
      color: 'bg-aqua-100',
      borderColor: 'border-aqua-200',
      id: 'spares'
    },
    {
      icon: '🛡️',
      title: '1 Year Warranty',
      desc: 'On all aerator sets',
      color: 'bg-green-100',
      borderColor: 'border-green-200',
      id: 'warranty'
    },
    {
      icon: '💎',
      title: 'Best Prices',
      desc: 'Factory direct rates',
      color: 'bg-amber-100',
      borderColor: 'border-amber-200',
      id: 'prices'
    },
    {
      icon: '🤝',
      title: 'End-to-End Support',
      desc: 'From purchase to after-sales',
      color: 'bg-purple-100',
      borderColor: 'border-purple-200',
      id: 'support'
    }
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % highlights.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [highlights.length]);

  const variants = {
    enter: { y: 120, opacity: 0, scale: 0.9, zIndex: 1 },
    center: { y: 0, opacity: 1, scale: 1, zIndex: 10 },
    bottom: { y: 100, opacity: 0.5, scale: 0.95, zIndex: 5 },
    exit: { y: -120, opacity: 0, scale: 0.9, zIndex: 0 }
  };

  const primaryItem = highlights[index];
  const secondaryItem = highlights[(index + 1) % highlights.length];

  return (
    <section className="py-8 pb-32 bg-white">
      <div className="container-custom px-4">
        {/* Increased height to allow 'peeking' next card, overflow hidden to mask exits */}
        <div className="max-w-md mx-auto h-[200px] relative flex flex-col items-center justify-center overflow-hidden">
          <AnimatePresence>
            {/* Render Primary Card */}
            <motion.div
              key={primaryItem.id}
              variants={variants}
              initial="bottom"
              animate="center"
              exit="exit"
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute w-full flex items-center gap-4 p-4 rounded-[20px] bg-white/60 backdrop-blur-md border border-white/50 shadow-sm"
              style={{ maxHeight: '88px', top: '56px' }} // Centered vertically in 200px container
            >
              <div className={`w-12 h-12 rounded-full ${primaryItem.color} flex items-center justify-center text-2xl shadow-inner shrink-0 transition-colors duration-500`}>
                {primaryItem.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-deep-blue-900 truncate">{primaryItem.title}</h3>
                <p className="text-xs text-steel-600 truncate">{primaryItem.desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <CategoriesSection />
      <TrustHighlightsSection />
      <ReviewsSection />
      <MapSection />
      <ContactForm />
    </div>
  );
}
