import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact Karthik Traders for paddle wheel aerators, spares and bulk aquaculture equipment enquiries. Call, WhatsApp or visit us in India.',
  alternates: { canonical: '/contact' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
