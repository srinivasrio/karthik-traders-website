import type { Metadata } from 'next';
import { getProductBySlug } from '@/data/products';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: product.name,
    description:
      product.description ||
      `Buy ${product.name} from Karthik Traders — aquaculture equipment for shrimp & fish farms with warranty and delivery across India.`,
    alternates: { canonical: `/products/${slug}` },
  };
}

export default function ProductSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
