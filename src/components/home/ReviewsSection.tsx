'use client';

import { REVIEWS_DATA } from '@/data/kt-ui';

export default function ReviewsSection() {
  return (
    <section
      id="reviews"
      className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-24 scroll-mt-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase mb-2">
            GOOGLE REVIEWS
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1A33] tracking-tight font-poppins">
            What Farmers Say
          </h2>
        </div>

        {/* Rating Badge */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#D5DCE8] shadow-2xs">
          <span className="text-[#E8A317] text-xs">★★★★★</span>
          <span className="text-xs font-bold text-[#0B1A33]">5.0 · Google</span>
        </div>
      </div>

      {/* DESKTOP VIEW: 4-Column Grid (>= 1024px) */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-5">
        {REVIEWS_DATA.map((r, i) => (
          <article
            key={r.name}
            className="relative rounded-[28px] p-7 flex flex-col justify-between gap-5 border transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-xs hover:shadow-md bg-[#FBFBFB] border-[#E3E8F0]"
          >
            {/* Background Accent Blob */}
            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-[#E8F9FF]/60 pointer-events-none" />

            {/* Quote SVG */}
            <svg
              width="36"
              height="28"
              viewBox="0 0 64 48"
              fill="#C4D9FF"
              aria-hidden="true"
              className="relative shrink-0"
            >
              <path d="M0 48V28C0 12 8 2 24 0v9C15 11 12 17 12 24h12v24zm36 0V28c0-16 8-26 24-28v9c-9 2-12 8-12 15h12v24z" />
            </svg>

            {/* Review text */}
            <p className="relative text-base font-bold text-[#0B1A33] leading-relaxed font-manrope">
              “{r.text}”
            </p>

            {/* Reviewer Meta */}
            <div className="relative flex flex-col gap-3 pt-2 border-t border-[#E3E8F0]/80">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#E8F9FF] text-[#0B5C86] font-extrabold text-sm flex items-center justify-center shrink-0 border border-[#C4D9FF]">
                  {r.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block font-extrabold text-sm text-[#0B1A33] truncate">
                    {r.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#5B6880] font-medium">
                    <span className="text-[#E8A317] tracking-wider text-xs">★★★★★</span>
                    <span>5/5 · Google</span>
                  </div>
                </div>
              </div>

              <a
                href="https://maps.app.goo.gl/uX3Qd8xX5gQYk1kG6"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-extrabold text-[#4338CA] hover:underline inline-flex items-center gap-1"
              >
                View on Google Maps ↗
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* MOBILE VIEW: Reduced Cards with Continuous Right-to-Left Loop (< 1024px) */}
      <div className="lg:hidden relative overflow-hidden -mx-4 sm:-mx-6 px-4 sm:px-6 py-2">
        {/* Scoped Keyframes for Super-Smooth Right-to-Left Continuous Loop */}
        <style>{`
          @keyframes ktSlideReviews {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(calc(-100% / 3), 0, 0); }
          }
          .animate-review-marquee {
            display: flex;
            width: max-content;
            animation: ktSlideReviews 26s linear infinite;
          }
          .animate-review-marquee:hover,
          .animate-review-marquee:active {
            animation-play-state: paused;
          }
        `}</style>

        {/* Smooth Edge Fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FBFBFB] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FBFBFB] to-transparent z-10" />

        {/* Continuous Loop Track */}
        <div className="animate-review-marquee flex gap-3.5 sm:gap-4 will-change-transform">
          {[...REVIEWS_DATA, ...REVIEWS_DATA, ...REVIEWS_DATA].map((r, i) => (
            <article
              key={`${r.name}-${i}`}
              className="w-[260px] sm:w-[280px] h-[162px] sm:h-[170px] flex-none p-4 rounded-2xl flex flex-col justify-between border bg-white border-[#C4D9FF] shadow-2xs select-none"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#E8A317] tracking-wider">
                  ★★★★★ 5/5
                </span>
                <span className="text-[10px] font-extrabold text-[#5B6880] uppercase tracking-wider">
                  Google Review
                </span>
              </div>

              <p className="text-[12.5px] sm:text-[13px] font-bold text-[#0B1A33] leading-snug font-manrope line-clamp-3">
                “{r.text}”
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-[#EEF2F8]">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="w-7 h-7 rounded-full bg-[#E8F9FF] text-[#0B5C86] font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-[#C4D9FF]">
                    {r.initials || r.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="font-extrabold text-xs text-[#0B1A33] truncate">
                    {r.name}
                  </span>
                </div>

                <a
                  href={r.url || 'https://maps.app.goo.gl/uX3Qd8xX5gQYk1kG6'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#1450C8] hover:underline shrink-0"
                >
                  Maps ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
