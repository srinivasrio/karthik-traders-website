'use client';

import HeroSection from '@/components/home/HeroSection';
import CategorySection from '@/components/home/CategorySection';
import BrandsSection from '@/components/home/BrandsSection';
import WhyUsSection from '@/components/home/WhyUsSection';
import ComparePromo from '@/components/home/ComparePromo';
import ReviewsSection from '@/components/home/ReviewsSection';
import LocationSection from '@/components/home/LocationSection';
import BulkEnquirySection from '@/components/home/BulkEnquirySection';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] selection:bg-[#C4D9FF]">
      {/* 01. Hero Section with Carousel & Quick Dials */}
      <HeroSection />

      {/* 02. Shop By Category Grid */}
      <CategorySection />

      {/* 03. Our Brands: Aqualion & Sea Boss */}
      <BrandsSection />

      {/* 04. Why Karthik Traders (4 Animated Pillars) */}
      <WhyUsSection />

      {/* 05. Compare Models Promo Card */}
      <ComparePromo />

      {/* 06. Google Customer Reviews */}
      <ReviewsSection />

      {/* 07. Location & Google Map */}
      <LocationSection />

      {/* 08. Bulk Orders & Dealer Inquiry Form */}
      <BulkEnquirySection />
    </div>
  );
}
