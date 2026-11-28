import { Suspense } from 'react';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import { aeratorSets } from '@/data/products';
import { getLiveProductsAction } from '@/lib/products-server';
import AeratorSetsClient from './AeratorSetsClient';
import type { Metadata } from 'next';

export const revalidate = 60; // Revalidate every minute
export const fetchCache = 'auto';

export const metadata: Metadata = {
    title: 'Paddle Wheel Aerator Sets',
    description: 'Complete paddle wheel aerator sets for shrimp & fish farms — Aqualion premium and Sea Boss budget models with floats, frames and impellers. Buy online in India.',
    alternates: { canonical: '/aerator-sets' },
};

// Server Component
export default async function AeratorSetsPage() {
    // Fetch live data on the server
    const products = await getLiveProductsAction(aeratorSets);

    return (
        <>
            <h1 className="sr-only">Paddle Wheel Aerator Sets</h1>
            <Suspense fallback={<SimpleLoadingScreen />}>
                <AeratorSetsClient initialProducts={products} />
            </Suspense>
        </>
    );
}
