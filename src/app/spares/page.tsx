import { Suspense } from 'react';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import { allSpares } from '@/data/products';
import { getLiveProductsAction } from '@/lib/products-server';
import SparesClient from './SparesClient';
import type { Metadata } from 'next';

export const revalidate = 60;
export const fetchCache = 'auto';

export const metadata: Metadata = {
    title: 'Aerator Spare Parts',
    description: 'Genuine spare parts for paddle wheel aerators — impellers, floats, frames, gearboxes and motors. Aqualion and Sea Boss spares shipped across India.',
    alternates: { canonical: '/spares' },
};

export default async function SparesPage() {
    // Fetch live data on the server
    const products = await getLiveProductsAction(allSpares);

    return (
        <>
            <h1 className="sr-only">Aerator Spare Parts</h1>
            <Suspense fallback={<SimpleLoadingScreen />}>
                <SparesClient initialProducts={products} />
            </Suspense>
        </>
    );
}
