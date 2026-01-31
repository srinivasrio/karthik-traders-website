import { Suspense } from 'react';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import { longArmProducts } from '@/data/products';
import { getLiveProductsAction } from '@/lib/products-server';
import LongArmClient from './LongArmClient';

export default async function LongArmPage() {
    // Fetch live data on the server
    const products = await getLiveProductsAction(longArmProducts);

    return (
        <Suspense fallback={<SimpleLoadingScreen />}>
            <LongArmClient initialProducts={products} />
        </Suspense>
    );
}
