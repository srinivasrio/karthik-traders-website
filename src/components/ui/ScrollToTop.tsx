'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        // Force scroll to top on route change
        window.scrollTo(0, 0);

        // Also try to scroll the main wrapper if it exists (for overflow:auto containers)
        const mainWrapper = document.getElementById('main-content');
        if (mainWrapper) {
            mainWrapper.scrollTo(0, 0);
        }
    }, [pathname]);

    // Safety watchdog: When tab becomes visible after being backgrounded/inactive,
    // ensure body overflow is never stuck in 'hidden' if all dialogs/menus are closed.
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // If body overflow was left 'hidden' by stale event listeners, reset it
                const hasOpenModal = document.querySelector('[role="dialog"], [role="alertdialog"]');
                if (!hasOpenModal && document.body.style.overflow === 'hidden') {
                    document.body.style.overflow = '';
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, []);

    return null;
}
