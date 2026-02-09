import { createClient } from '@/lib/supabase-server';
import CouponForm from './CouponForm';
import { aeratorSets, allProducts } from '@/data/products'; // Assuming static data is the source of truth for products

export const dynamic = 'force-dynamic';

export default async function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const isNew = id === 'new';

    let coupon = null;
    let selectedProductIds: string[] = [];

    if (!isNew) {
        const supabase = await createClient();

        // Fetch coupon
        const { data: couponData, error: couponError } = await supabase
            .from('coupons')
            .select('*')
            .eq('id', id)
            .single();

        if (couponError) {
            console.error('Error fetching coupon:', couponError);
        } else {
            coupon = couponData;

            // Priority: Check 'applicable_products' column first (New Schema)
            if (couponData.applicable_products && Array.isArray(couponData.applicable_products) && couponData.applicable_products.length > 0) {
                selectedProductIds = couponData.applicable_products;
            } else {
                // Fallback: Fetch associated aerators (Old Schema)
                const { data: relationData, error: relationError } = await supabase
                    .from('coupon_aerators')
                    .select('product_id')
                    .eq('coupon_id', id);

                if (relationError) {
                    console.error('Error fetching coupon aerators:', relationError);
                } else if (relationData) {
                    selectedProductIds = relationData.map((r: any) => r.product_id);
                }
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">
                {isNew ? 'Create New Coupon' : 'Edit Coupon'}
            </h1>
            <CouponForm
                initialCoupon={coupon}
                initialSelectedAerators={selectedProductIds}
                allAerators={allProducts} // Pass FULL product list (Aerators, Motors, Spares)
            />
        </div>
    );
}
