import type { Metadata } from 'next';
import { getProductBySlug } from '@/data/products';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Long Arm Aerator Not Found' };
  return {
    title: product.name,
    description:
      product.description ||
      `Buy ${product.name} from Karthik Traders — long arm paddle wheel aerator for deep ponds with warranty and delivery across India.`,
    alternates: { canonical: `/long-arm/${slug}` },
  };
}

export default function LongArmSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
