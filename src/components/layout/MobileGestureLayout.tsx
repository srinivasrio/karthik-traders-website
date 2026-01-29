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

    // Swipe handling
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const SWIPE_THRESHOLD = 50;
        if (info.offset.x > SWIPE_THRESHOLD && onSwipeRight) {
            onSwipeRight();
        } else if (info.offset.x < -SWIPE_THRESHOLD && onSwipeLeft) {
            onSwipeLeft();
        }

        // Simple manual pull down check
        if (info.offset.y > 100 && onPullDown) {
            onPullDown();
        } else if (info.offset.y < -100 && onSwipeUp) {
            onSwipeUp();
        }
    };

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="min-h-screen touch-pan-y"
        >
            {children}
        </motion.div>
    );
}
