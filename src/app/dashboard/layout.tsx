import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your Karthik Traders orders and profile.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/dashboard' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
