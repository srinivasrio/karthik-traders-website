"use client";

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';

interface PDFDownloadWrapperProps {
    order: any;
    variant: 'admin' | 'customer';
}

export default function PDFDownloadWrapper({ order, variant }: PDFDownloadWrapperProps) {
    return (
        <PDFDownloadLink
            document={<InvoicePDF order={order} />}
            fileName={`Invoice-${order.order_number || order.id.slice(0, 8)}.pdf`}
            className={`${variant === 'admin'
                ? 'px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-bold'
                : 'px-5 py-2.5 bg-[#0B1A33] hover:bg-[#1D64EC] text-white font-extrabold rounded-full text-xs shadow-md active:scale-95'
                } flex items-center justify-center gap-2 transition-all cursor-pointer`}
        >
            {/* @ts-ignore */}
            {({ blob, url, loading, error }) => {
                if (loading) return 'Generating...';
                if (error) {
                    console.error("PDF Generation Error:", error);
                    return <span title={String(error)}>Error: {String(error).slice(0, 20)}...</span>;
                }
                return (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {variant === 'admin' ? 'Invoice' : 'Download Invoice'}
                    </>
                );
            }}
        </PDFDownloadLink>
    );
}
