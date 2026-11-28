import { Suspense } from 'react';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import { longArmProducts } from '@/data/products';
import { getLiveProductsAction } from '@/lib/products-server';
import LongArmClient from './LongArmClient';
import type { Metadata } from 'next';

export const revalidate = 60;
export const fetchCache = 'auto';

export const metadata: Metadata = {
    title: 'Long Arm Aerators',
    description: 'Long arm paddle wheel aerators for deep ponds and large aquaculture farms. Durable Aqualion and Sea Boss long arm models with warranty and delivery across India.',
    alternates: { canonical: '/long-arm' },
};

export default async function LongArmPage() {
    // Fetch live data on the server
    const products = await getLiveProductsAction(longArmProducts);

    return (
        <>
            <h1 className="sr-only">Long Arm Aerators</h1>
            <Suspense fallback={<SimpleLoadingScreen />}>
                <LongArmClient initialProducts={products} />
            </Suspense>
        </>
    );
}
