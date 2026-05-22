'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import InvoicePDF from './InvoicePDF';

const PDFDownloadLink = dynamic(
    () => import('./PDFDownloadWrapper'),
    {
        ssr: false,
        loading: () => (
            <button disabled className="px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded flex items-center gap-2">
                Loading PDF...
            </button>
        ),
    }
);

interface DownloadInvoiceBtnProps {
    order: any;
    variant?: 'admin' | 'customer';
}

export default function DownloadInvoiceBtn({ order, variant = 'customer' }: DownloadInvoiceBtnProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    // Access Control: Only allow download if status is not 'pending' (Approved)
    // This applies to both Admin and Customer as per user request.
    const status = order.status?.toLowerCase() || '';
    const isApproved = status !== 'pending' && status !== 'cancelled' && status !== 'cart' && status !== '';

    // Debugging
    console.log('Invoice Access Debug:', { id: order.id, status, isApproved, variant });

    if (!isApproved) {
        if (variant === 'admin') {
            return <span className="text-xs text-slate-400 italic">Invoice unavailable (Pending)</span>;
        }
        return null;
    }

    return <PDFDownloadLink order={order} variant={variant} />;
}
