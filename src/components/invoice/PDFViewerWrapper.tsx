"use client";

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';

interface PDFViewerWrapperProps {
    order: any;
    width?: string | number;
    height?: string | number;
    className?: string;
}

export default function PDFViewerWrapper({ order, width = "100%", height = "100%", className = "border-0" }: PDFViewerWrapperProps) {
    return (
        <PDFViewer width={width} height={height} className={className}>
            <InvoicePDF order={order} />
        </PDFViewer>
    );
}
