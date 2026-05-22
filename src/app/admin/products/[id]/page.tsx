"use client";

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600" />
            </div>
        }>
            <EditProductContent />
        </Suspense>
    );
}

function EditProductContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const fromCategory = searchParams.get('fromCategory') || 'all';
    const returnUrl = fromCategory && fromCategory !== 'all'
        ? `/admin/products?category=${fromCategory}`
        : '/admin/products';

    return (
        <ProductForm
            mode="edit"
            productId={id}
            returnUrl={returnUrl}
        />
    );
}
