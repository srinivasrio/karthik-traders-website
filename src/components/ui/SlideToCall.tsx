'use client';

import { useState, useRef, useEffect } from 'react';

interface SlideToCallProps {
  label: string;
  phone: string;
  subLabel?: string;
  className?: string;
  delayIndex?: number;
}

export default function SlideToCall({
  label,
  phone,
  subLabel,
  className = '',
  delayIndex = 0,
}: SlideToCallProps) {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [maxTravel, setMaxTravel] = useState(240);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startProgressRef = useRef<number>(0);
  const pointerDownTimeRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const isIdle = !isDragging && dragProgress === 0 && !isCalling;
  const animDelay = `${delayIndex * 0.7}s`;

  useEffect(() => {
    const updateWidth = () => {
      if (trackRef.current) {
        // Track width minus knob width (48px) minus margins (8px)
        setMaxTravel(Math.max(120, trackRef.current.clientWidth - 56));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const triggerCall = () => {
    setIsCalling(true);
    setDragProgress(1);
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${cleanPhone}`;
    }
    setTimeout(() => {
      setIsCalling(false);
      setDragProgress(0);
    }, 1800);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    hasMovedRef.current = false;
    pointerDownTimeRef.current = Date.now();
    startXRef.current = e.clientX;
    startProgressRef.current = dragProgress;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 5) {
      hasMovedRef.current = true;
    }
    const newProgress = Math.max(0, Math.min(1, startProgressRef.current + delta / maxTravel));
    setDragProgress(newProgress);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const pressDuration = Date.now() - pointerDownTimeRef.current;

    // Quick tap detection (user tapped the button directly instead of dragging)
    if (!hasMovedRef.current && pressDuration < 450) {
      triggerCall();
      return;
    }

    if (dragProgress >= 0.6) {
      triggerCall();
    } else {
      setDragProgress(0);
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the user clicks on the track outside the knob, initiate call with smooth feedback
    if (!isDragging && !isCalling && dragProgress === 0) {
      triggerCall();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerCall();
    }
  };

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      className={`relative h-14 rounded-full bg-gradient-to-r from-[#EBF9F1] via-[#D5F3E2] to-[#C3EDD5] border border-[#98D8B4] shadow-[inset_0_2px_6px_rgba(18,140,74,0.12),0_10px_24px_-12px_rgba(18,140,74,0.6)] overflow-hidden select-none touch-none font-poppins cursor-pointer ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${label}. Slide or tap to place call.`}
    >
      {/* Ambient Gleam Light Sweep */}
      <div
        className="absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none -skew-x-12 z-0"
        style={{
          animation: `ktTrackSheen 4.5s ease-in-out ${delayIndex * 0.9}s infinite`,
        }}
      />

      {/* Dynamic progress fill with nudge animation when idle */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#70D499] to-[#A8E6C3] rounded-full z-[1]"
        style={{
          width: isIdle ? undefined : `${52 + dragProgress * maxTravel}px`,
          animation: isIdle ? `ktFillNudge 3.4s cubic-bezier(0.6, 0, 0.3, 1) ${animDelay} infinite` : 'none',
          transition: isDragging ? 'none' : 'width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />

      {/* Label, shimmering text and flowing chevrons */}
      <div
        className="absolute inset-0 flex items-center justify-center gap-2 pl-12 pr-4 pointer-events-none transition-opacity z-[2]"
        style={{ opacity: Math.max(0, 1 - dragProgress * 1.8) }}
      >
        <span
          className="font-bold text-xs sm:text-sm tracking-tight truncate select-none inline-block"
          style={{
            background: 'linear-gradient(100deg, #0B7A4B 22%, #22A065 44%, #FFFFFF 52%, #22A065 60%, #0B7A4B 80%)',
            backgroundSize: '250% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: '#0B7A4B',
            animation: 'ktShimmer 2.6s linear infinite',
          }}
        >
          {isCalling ? 'Connecting Call...' : label}
        </span>
        
        {subLabel && (
          <span className="font-mono text-[11px] text-[#0B7A4B]/85 hidden sm:inline">
            · {subLabel}
          </span>
        )}

        {/* Triple animated flowing chevrons */}
        <div className="flex items-center -space-x-1.5 shrink-0" aria-hidden="true">
          <svg
            className="w-3.5 h-3.5 text-[#0B7A4B]"
            style={{ animation: 'ktChev 1.3s ease-in-out 0s infinite' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <svg
            className="w-3.5 h-3.5 text-[#0B7A4B]"
            style={{ animation: 'ktChev 1.3s ease-in-out 0.2s infinite' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <svg
            className="w-3.5 h-3.5 text-[#0B7A4B]"
            style={{ animation: 'ktChev 1.3s ease-in-out 0.4s infinite' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>

      {/* Draggable & Animating Knob */}
      <div
        className="absolute left-1 top-1 w-12 h-12 z-[3]"
        style={{
          transform: isIdle ? undefined : `translateX(${dragProgress * maxTravel}px)`,
          animation: isIdle ? `ktSlideNudge 3.4s cubic-bezier(0.6, 0, 0.3, 1) ${animDelay} infinite` : 'none',
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Sonar / Radar pulse wave ring radiating from knob */}
        <span
          className="absolute inset-0 rounded-full bg-[#25B86B] pointer-events-none"
          style={{
            animation: `ktSonarWave 2.4s cubic-bezier(0.1, 0.8, 0.3, 1) ${animDelay} infinite`,
          }}
          aria-hidden="true"
        />

        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
          aria-label={`Slide to call ${label}`}
          className="relative w-full h-full rounded-full border-2 border-white bg-gradient-to-br from-[#2ADE7C] via-[#22C55E] to-[#0E7A40] text-white grid place-items-center cursor-grab active:cursor-grabbing shadow-[0_8px_20px_-4px_rgba(18,140,74,0.7),0_0_0_3px_rgba(34,197,94,0.22)] active:scale-95 transition-transform"
        >
          {isCalling ? (
            <svg
              className="w-5 h-5 text-white animate-bounce"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 pointer-events-none drop-shadow-xs"
              style={{
                animation: `ktPhoneRing 3.2s ease-in-out ${delayIndex * 0.7 + 0.2}s infinite`,
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}