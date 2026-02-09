import { createClient } from '@/lib/supabase-server';
import CouponsListClient from './CouponsListClient';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
    const supabase = await createClient();
    const { data: coupons, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching coupons:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Coupons Management</h1>
            </div>
            <CouponsListClient initialCoupons={coupons || []} />
        </div>
    );
}
