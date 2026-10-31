'use client';

import { use } from 'react';
import Link from 'next/link';
import { longArmProducts, getProductBySlug } from '@/data/products';
import { useLiveProduct } from '@/hooks/useLiveProducts';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import ProductDetailView from '@/components/products/ProductDetailView';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function LongArmDetailPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const initialProduct = getProductBySlug(slug);
  const { product, loading } = useLiveProduct(initialProduct, slug);

  if (loading) {
    return <SimpleLoadingScreen />;
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#FBFBFB]">
        <div className="text-center p-8 bg-white rounded-3xl border border-[#E3E8F0] shadow-sm max-w-md">
          <h1 className="text-2xl font-extrabold text-[#0B1A33] mb-3 font-poppins">
            Long Arm System Not Found
          </h1>
          <p className="text-sm text-[#5B6880] mb-6">
            The long arm aerator or fitting you are looking for may have been updated.
          </p>
          <Link
            href="/long-arm"
            className="inline-flex h-11 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
          >
            Browse All Long Arm Systems
          </Link>
        </div>
      </div>
    );
  }

  const related = longArmProducts.filter((p) => p.slug !== product.slug);

  return (
    <ProductDetailView
      product={product}
      categoryTitle="Long Arm"
      categoryHref="/long-arm"
      relatedProducts={related}
    />
  );
}
