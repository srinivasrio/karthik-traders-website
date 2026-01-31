import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, mobile, location, message } = body;

        if (!name || !mobile) {
            return NextResponse.json({ error: 'Name and Mobile are required' }, { status: 400 });
        }

        // 1. Insert into Database
        const { error: dbError } = await supabaseAdmin
            .from('contact_inquiries')
            .insert([{
                name,
                mobile,
                location,
                message,
                status: 'new'
            }]);

        if (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
        }

        // 2. Format Telegram Message
        const telegramText = `
<b>📞 New Contact Inquiry</b>
━━━━━━━━━━━━━━━━━━
<b>Name:</b> ${name}
<b>Mobile:</b> <code>${mobile}</code>
<b>Location:</b> ${location || 'Not provided'}
━━━━━━━━━━━━━━━━━━
<b>Message:</b>
<i>${message || 'No message'}</i>
`.trim();

        // 3. Send Telegram Notification (don't block the response)
        sendTelegramMessage(telegramText).catch(err => {
            console.error('Async Telegram Error:', err);
        });

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Internal Server Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
