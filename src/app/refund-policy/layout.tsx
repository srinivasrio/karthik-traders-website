import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund and return policy for Karthik Traders aquaculture equipment orders.',
  alternates: { canonical: '/refund-policy' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
