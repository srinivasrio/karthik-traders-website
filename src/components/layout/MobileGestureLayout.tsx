'use client';

import { ReactNode } from 'react';
import { motion, PanInfo } from 'framer-motion';

interface MobileGestureLayoutProps {
    children: ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onPullDown?: () => void;
    onSwipeUp?: () => void;
}

export default function MobileGestureLayout({
    children,
    onSwipeLeft,
    onSwipeRight,
    onPullDown,
    onSwipeUp
}: MobileGestureLayoutProps) {
    const minSwipeDistance = 50;

    // We don't need state for touch start/end if we just use refs or simple handlers?
    // Actually, React events are robust enough.
    // Let's use a simple implementation that doesn't block scroll.

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX = e.targetTouches[0].clientX;
        touchStartY = e.targetTouches[0].clientY;
    }

    const onTouchMove = (e: React.TouchEvent) => {
        touchEndX = e.targetTouches[0].clientX;
        touchEndY = e.targetTouches[0].clientY;
    }

    const onTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;

        const distanceX = touchStartX - touchEndX;
        const distanceY = touchStartY - touchEndY;
        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;
        const isUpSwipe = distanceY > minSwipeDistance;
        const isDownSwipe = distanceY < -minSwipeDistance;

        // Only trigger horizontal swipes if vertical movement is small (intentional swipe)
        if (Math.abs(distanceX) > Math.abs(distanceY)) {
            if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
            if (isRightSwipe && onSwipeRight) onSwipeRight();
        } else {
            // Vertical swipes
            if (isUpSwipe && onSwipeUp) onSwipeUp();
            if (isDownSwipe && onPullDown) onPullDown();
        }
    };

    return (
        <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="min-h-screen"
        >
            {children}
        </div>
    );
}
