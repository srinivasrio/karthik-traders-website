import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your Karthik Traders account password.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/forgot-password' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
