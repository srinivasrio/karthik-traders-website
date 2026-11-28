import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Karthik Traders — how we collect, use and protect your information.',
  alternates: { canonical: '/privacy-policy' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
