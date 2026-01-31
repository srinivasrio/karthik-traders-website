import { Suspense } from 'react';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import { aeratorSets } from '@/data/products';
import { getLiveProductsAction } from '@/lib/products-server';
import AeratorSetsClient from './AeratorSetsClient';

// Server Component
export default async function AeratorSetsPage() {
    // Fetch live data on the server
    const products = await getLiveProductsAction(aeratorSets);

    return (
        <Suspense fallback={<SimpleLoadingScreen />}>
            <AeratorSetsClient initialProducts={products} />
        </Suspense>
    );
}
