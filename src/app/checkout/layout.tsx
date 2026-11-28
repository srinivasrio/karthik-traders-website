import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your Karthik Traders order.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/checkout' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
