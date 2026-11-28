import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bulk & Wholesale Orders',
  description: 'Get wholesale pricing on paddle wheel aerators, motors and spares. Bulk order discounts for shrimp & fish farm distributors across India.',
  alternates: { canonical: '/bulk-orders' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
