'use client';

import dynamic from 'next/dynamic';
import InvoicePDF from './InvoicePDF';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[600px] bg-slate-100 flex items-center justify-center text-slate-500 rounded border border-slate-200">
                Loading Invoice Preview...
            </div>
        ),
    }
);

interface InvoiceViewerProps {
    order: any;
}

export default function InvoiceViewer({ order }: InvoiceViewerProps) {
    return (
        <div className="w-full h-[800px] mt-6 bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Invoice Preview</h3>
            </div>
            <PDFViewer width="100%" height="100%" className="border-0">
                <InvoicePDF order={order} />
            </PDFViewer>
        </div>
    );
}
