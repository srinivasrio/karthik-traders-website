import { Suspense } from 'react';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import { motors, allGearboxes } from '@/data/products';
import { getLiveProductsAction } from '@/lib/products-server';
import ProductsClient from './ProductsClient';

export default async function ProductsPage() {
    const initialStaticProducts = [...motors, ...allGearboxes];
    // Fetch live data on the server
    const products = await getLiveProductsAction(initialStaticProducts);

    return (
        <Suspense fallback={<SimpleLoadingScreen />}>
            <ProductsClient initialProducts={products} />
        </Suspense>
    );
}
