import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your Karthik Traders account.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/login' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
