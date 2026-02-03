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

    return null;
}
