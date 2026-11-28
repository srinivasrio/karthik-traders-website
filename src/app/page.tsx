'use client';

import dynamic from 'next/dynamic';
import HeroSection from '@/components/home/HeroSection';
import CategorySection from '@/components/home/CategorySection';
import LazyMount from '@/components/ui/LazyMount';

// Below-the-fold sections: code-split and mounted only when scrolled near.
// Keeps framer-motion + the large Compare/Brands sections out of the
// initial bundle, speeding up first paint and interactivity.
const BrandsSection = dynamic(() => import('@/components/home/BrandsSection'), { ssr: false });
const WhyUsSection = dynamic(() => import('@/components/home/WhyUsSection'), { ssr: false });
const ComparePromo = dynamic(() => import('@/components/home/ComparePromo'), { ssr: false });
const ReviewsSection = dynamic(() => import('@/components/home/ReviewsSection'), { ssr: false });
const LocationSection = dynamic(() => import('@/components/home/LocationSection'), { ssr: false });
const BulkEnquirySection = dynamic(() => import('@/components/home/BulkEnquirySection'), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] selection:bg-[#C4D9FF]">
      {/* 01. Hero Section with Carousel & Quick Dials */}
      <HeroSection />

      {/* 02. Shop By Category Grid */}
      <CategorySection />

      {/* 03. Our Brands: Aqualion & Sea Boss */}
      <LazyMount><BrandsSection /></LazyMount>

      {/* 04. Why Karthik Traders (4 Animated Pillars) */}
      <LazyMount><WhyUsSection /></LazyMount>

      {/* 05. Compare Models Promo Card */}
      <LazyMount><ComparePromo /></LazyMount>

      {/* 06. Google Customer Reviews */}
      <LazyMount><ReviewsSection /></LazyMount>

      {/* 07. Location & Google Map */}
      <LazyMount><LocationSection /></LazyMount>

      {/* 08. Bulk Orders & Dealer Inquiry Form */}
      <LazyMount><BulkEnquirySection /></LazyMount>
    </div>
  );
}
