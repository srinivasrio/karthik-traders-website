
import crypto from 'crypto';

/**
 * Generates a deterministic, secure password for a user based on their phone number.
 * This ensures that we can "log in" the user to Supabase using their phone number
 * without storing the actual password, effectively bridging Firebase OTP to Supabase.
 */
export function generateDerivedPassword(phone: string): string {
    const secret = process.env.SUPABASE_AUTH_SECRET;
    if (!secret) {
        throw new Error('SUPABASE_AUTH_SECRET is not defined in environment variables');
    }

    // Create an HMAC (Hash-based Message Authentication Code)
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(phone);
    return hmac.digest('hex');
}

/**
 * Generates a unique email for the user based on their phone number.
 * Since Supabase Auth requires an email, we use this strictly for identification.
 */
export function generateDerivedEmail(phone: string): string {
    // Sanitize phone to ensure it's just numbers (optional, but good practice)
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    return `${cleanPhone}@karthik-traders.internal`;
}
