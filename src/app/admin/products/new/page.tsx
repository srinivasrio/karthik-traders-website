"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600" />
            </div>
        }>
            <NewProductContent />
        </Suspense>
    );
}

function NewProductContent() {
    const searchParams = useSearchParams();
    const fromCategory = searchParams.get('fromCategory') || 'all';
    const returnUrl = fromCategory && fromCategory !== 'all'
        ? `/admin/products?category=${fromCategory}`
        : '/admin/products';

    return (
        <ProductForm
            mode="create"
            returnUrl={returnUrl}
        />
    );
}
