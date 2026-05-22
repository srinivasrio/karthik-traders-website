import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const isServer = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        lock: typeof window !== 'undefined'
            ? async (name, acquireTimeout, fn) => {
                return await fn();
              }
            : undefined
    },
    global: {
        fetch: isServer
            ? (url, options) => fetch(url, { ...options, cache: 'no-store' })
            : undefined
    }
});


