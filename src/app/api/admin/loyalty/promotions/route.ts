import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';

export async function GET(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('loyalty_promotions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
                return NextResponse.json({ success: true, promotions: [] });
            }
            throw error;
        }
        return NextResponse.json({ success: true, promotions: data || [] });
    } catch (error: any) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            return NextResponse.json({ success: true, promotions: [] });
        }
        console.error('Promotions GET error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch promotions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            code,
            description,
            promotion_type,
            bonus_value,
            min_cart_subtotal_paise,
            start_date,
            end_date,
            is_active,
        } = body;

        if (!name || !promotion_type || !bonus_value) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('loyalty_promotions')
            .insert({
                name: name.trim(),
                code: code ? code.trim().toUpperCase() : null,
                description: description || null,
                promotion_type,
                bonus_value: parseFloat(bonus_value),
                min_cart_subtotal_paise: parseInt(min_cart_subtotal_paise || '0', 10),
                start_date: start_date || new Date().toISOString(),
                end_date: end_date || null,
                is_active: is_active ?? true,
            })
            .select()
            .single();

        if (error) throw error;

        // Log to audit
        try {
            await supabase.from('loyalty_admin_audit').insert({
                admin_user_id: authResult.user.id,
                action_type: 'promotion_create',
                reason: `Created promotional campaign: ${name}`,
                details: data,
            });
        } catch (err) {
            console.error('Audit failed:', err);
        }

        return NextResponse.json({ success: true, promotion: data });
    } catch (error: any) {
        console.error('Promotion creation error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create promotion' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('loyalty_promotions')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log to audit
        try {
            await supabase.from('loyalty_admin_audit').insert({
                admin_user_id: authResult.user.id,
                action_type: 'promotion_update',
                reason: `Updated campaign ID: ${id}`,
                details: updates,
            });
        } catch (err) {
            console.error('Audit failed:', err);
        }

        return NextResponse.json({ success: true, promotion: data });
    } catch (error: any) {
        console.error('Promotion update error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update promotion' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from('loyalty_promotions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        try {
            await supabase.from('loyalty_admin_audit').insert({
                admin_user_id: authResult.user.id,
                action_type: 'promotion_delete',
                reason: `Deleted campaign ID: ${id}`,
                details: { id },
            });
        } catch (err) {
            console.error('Audit failed:', err);
        }

        return NextResponse.json({ success: true, message: 'Promotion deleted' });
    } catch (error: any) {
        console.error('Promotion delete error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete promotion' }, { status: 500 });
    }
}
