import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Karthik Traders is a trusted Indian supplier of paddle wheel aerators, motors, gearboxes and spares for shrimp and fish farms.',
  alternates: { canonical: '/about-us' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
