import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://karthiktraders.in';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
            ? (url, options) => {
                const fetchOptions: any = { ...options };
                // Allow high-speed ISR caching (60s revalidation) for server components unless explicitly overridden
                if (!fetchOptions.cache && !fetchOptions.next) {
                    fetchOptions.next = { revalidate: 60 };
                }
                return fetch(url, fetchOptions);
            }
            : undefined
    }
});


