import { Suspense } from 'react';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import { allSpares } from '@/data/products';
import { getLiveProductsAction } from '@/lib/products-server';
import SparesClient from './SparesClient';

export default async function SparesPage() {
    // Fetch live data on the server
    const products = await getLiveProductsAction(allSpares);

    return (
        <Suspense fallback={<SimpleLoadingScreen />}>
            <SparesClient initialProducts={products} />
        </Suspense>
    );
}
