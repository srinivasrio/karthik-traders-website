'use client';

import { use } from 'react';
import Link from 'next/link';
import { aeratorSets, getProductBySlug } from '@/data/products';
import { useLiveProduct } from '@/hooks/useLiveProducts';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import ProductDetailView from '@/components/products/ProductDetailView';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function AeratorSetDetailPage({ params }: ProductPageProps) {
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
            Product Not Found
          </h1>
          <p className="text-sm text-[#5B6880] mb-6">
            The aerator set you are looking for is either discontinued or moved.
          </p>
          <Link
            href="/aerator-sets"
            className="inline-flex h-11 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
          >
            Browse All Aerator Sets
          </Link>
        </div>
      </div>
    );
  }

  // Related aerator sets
  const related = aeratorSets.filter((p) => p.slug !== product.slug);

  return (
    <ProductDetailView
      product={product}
      categoryTitle="Aerator Sets"
      categoryHref="/aerator-sets"
      relatedProducts={related}
    />
  );
}
