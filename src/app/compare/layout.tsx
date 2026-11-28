import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Aerators',
  description: 'Compare paddle wheel aerator sets side by side — Aqualion vs Sea Boss specs, prices and features to choose the right aquaculture equipment.',
  alternates: { canonical: '/compare' },
};

export default function RouteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
