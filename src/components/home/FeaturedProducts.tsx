'use client';

import ProductCard from '@/components/products/ProductCard';
import { aeratorSets } from '@/data/products';
import Link from 'next/link';

export default function FeaturedProducts() {
    // Get 4 featured products (2 from each brand)
    const aqualionProducts = aeratorSets.filter(p => p.brand === 'aqualion').slice(0, 2);
    const seabossProducts = aeratorSets.filter(p => p.brand === 'seaboss').slice(0, 2);
    const featured = [...aqualionProducts, ...seabossProducts];

    return (
        <section className="py-16 md:py-24 bg-steel-50">
            <div className="container-custom">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-aqua-100 text-aqua-700 text-sm font-medium mb-4">
                        Best Sellers
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-deep-blue-800 mb-4">
                        Featured Aerator Sets
                    </h2>
                    <p className="text-steel-600 max-w-2xl mx-auto">
                        Our most popular paddle wheel aerator sets, trusted by farms across India.
                        Complete with motor, gearbox, floats, fans, frame, and kit box.
                    </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
                    {featured.map((product, index) => (
                        <div key={product.id} className="h-full">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

                {/* View All CTA */}
                <div className="text-center">
                    <Link href="/aerator-sets" className="btn btn-primary">
                        View All Aerator Sets
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
