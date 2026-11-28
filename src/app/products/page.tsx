import { Suspense } from 'react';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import { motors, allGearboxes } from '@/data/products';
import { getLiveProductsAction } from '@/lib/products-server';
import ProductsClient from './ProductsClient';
import type { Metadata } from 'next';

export const revalidate = 60;
export const fetchCache = 'auto';

export const metadata: Metadata = {
    title: 'Aerator Motors & Gearboxes',
    description: 'Shop paddle wheel aerator motors and gearboxes for shrimp & fish farms. Aqualion and Sea Boss aquaculture equipment with warranty and fast delivery across India.',
    alternates: { canonical: '/products' },
};

export default async function ProductsPage() {
    const initialStaticProducts = [...motors, ...allGearboxes];
    // Fetch live data on the server
    const products = await getLiveProductsAction(initialStaticProducts);

    return (
        <>
            {/* Server-rendered H1 so it is present in initial HTML for crawlers */}
            <h1 className="sr-only">Aerator Motors &amp; Gearboxes</h1>
            <Suspense fallback={<SimpleLoadingScreen />}>
                <ProductsClient initialProducts={products} />
            </Suspense>
        </>
    );
}
