import type { Metadata } from 'next';
import { getProductBySlug } from '@/data/products';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Spare Part Not Found' };
  return {
    title: product.name,
    description:
      product.description ||
      `Buy ${product.name} from Karthik Traders — genuine aerator spare part with warranty and delivery across India.`,
    alternates: { canonical: `/spares/${slug}` },
  };
}

export default function SpareSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
