'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        try {
            const refParam = searchParams.get('ref');
            if (refParam && refParam.trim()) {
                const cleanCode = refParam.trim().toUpperCase();
                localStorage.setItem('kt_referral_code', cleanCode);
                window.dispatchEvent(new CustomEvent('kt_referral_detected', { detail: cleanCode }));
            }
        } catch (e) {
            // Ignore storage errors in restricted iframe
        }
    }, [searchParams]);

    return null;
}

