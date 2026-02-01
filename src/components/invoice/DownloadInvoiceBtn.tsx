'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import InvoicePDF from './InvoicePDF';

// Dynamically import PDFDownloadLink to avoid SSR issues with @react-pdf/renderer
const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
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

    return (
        <PDFDownloadLink
            document={<InvoicePDF order={order} />}
            fileName={`Invoice-${order.order_number || order.id.slice(0, 8)}.pdf`}
            className={`${variant === 'admin'
                ? 'px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700'
                : 'px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                } text-xs font-bold rounded flex items-center gap-2 transition-colors`}
        >
            {/* @ts-ignore */}
            {({ blob, url, loading, error }) =>
                loading ? 'Generating...' : (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {variant === 'admin' ? 'Invoice' : 'Download Invoice'}
                    </>
                )
            }
        </PDFDownloadLink>
    );
}
