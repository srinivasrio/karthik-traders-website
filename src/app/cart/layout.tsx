import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review the items in your Karthik Traders cart.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/cart' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
