'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Renders its children only once it scrolls near the viewport.
 * Combined with next/dynamic(ssr:false), this keeps a section's JS chunk
 * out of the initial bundle and off the main thread until the user
 * actually scrolls toward it — cuts initial hydration cost and TBT.
 * A min-height placeholder reserves space to avoid layout shift (CLS).
 */
export default function LazyMount({
  children,
  minHeight = 480,
  rootMargin = '300px',
}: {
  children: React.ReactNode;
  minHeight?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // ponytail: no IntersectionObserver (old browser) -> just render.
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}
