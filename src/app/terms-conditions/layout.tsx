import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for purchasing from Karthik Traders.',
  alternates: { canonical: '/terms-conditions' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
