import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Profile',
  description: 'Complete your Karthik Traders profile.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/complete-profile' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
