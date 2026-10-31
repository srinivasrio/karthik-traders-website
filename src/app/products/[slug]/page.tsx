'use client';

import { use } from 'react';
import Link from 'next/link';
import { allProducts, getProductBySlug } from '@/data/products';
import { useLiveProduct } from '@/hooks/useLiveProducts';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import ProductDetailView from '@/components/products/ProductDetailView';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
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
            The motor or gearbox you are looking for is either discontinued or moved.
          </p>
          <Link
            href="/products"
            className="inline-flex h-11 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
          >
            Browse All Motors & Gearboxes
          </Link>
        </div>
      </div>
    );
  }

  const related = allProducts.filter(
    (p) =>
      p.slug !== product.slug &&
      ['motor', 'motors', 'worm-gearbox', 'bevel-gearbox', 'gearboxes'].includes(
        p.category as string
      )
  );

  return (
    <ProductDetailView
      product={product}
      categoryTitle="Motors & Gearboxes"
      categoryHref="/products"
      relatedProducts={related}
    />
  );
}
