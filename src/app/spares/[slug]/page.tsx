'use client';

import { use } from 'react';
import Link from 'next/link';
import { allSpares, getProductBySlug } from '@/data/products';
import { useLiveProduct } from '@/hooks/useLiveProducts';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import ProductDetailView from '@/components/products/ProductDetailView';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function SpareDetailPage({ params }: ProductPageProps) {
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
            Spare Part Not Found
          </h1>
          <p className="text-sm text-[#5B6880] mb-6">
            The replacement spare you are looking for may be available offline in our warehouse.
          </p>
          <Link
            href="/spares"
            className="inline-flex h-11 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
          >
            Browse All Spares
          </Link>
        </div>
      </div>
    );
  }

  const related = allSpares.filter((p) => p.slug !== product.slug);

  return (
    <ProductDetailView
      product={product}
      categoryTitle="Spares"
      categoryHref="/spares"
      relatedProducts={related}
    />
  );
}
