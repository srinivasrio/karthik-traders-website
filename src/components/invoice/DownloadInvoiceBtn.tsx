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

    if (!isClient || !order) return null;

    // Access Control: Allow download for all active orders (including pending orders placed by customer)
    // Only cancel orders are blocked from tax invoice download.
    const status = order.status?.toLowerCase() || '';
    if (status === 'cancelled') {
        if (variant === 'admin') {
            return <span className="text-xs text-rose-500 italic">Invoice unavailable (Cancelled)</span>;
        }
        return null;
    }

    return <PDFDownloadLink order={order} variant={variant} />;
}
