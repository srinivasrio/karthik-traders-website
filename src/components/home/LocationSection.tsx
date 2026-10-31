'use client';

import { CONTACT_INFO } from '@/data/kt-ui';

export default function LocationSection() {
  return (
    <section id="location" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-24 scroll-mt-24">
      <div className="rounded-[36px] bg-[#E8F9FF] border border-[#C4D9FF] p-6 sm:p-10 lg:p-12 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Details */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1A33] tracking-tight font-poppins">
                VISIT OUR STORE
              </h2>
            </div>

            <div className="flex flex-col gap-4 text-sm sm:text-base text-[#0B1A33]">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-white text-[#0B5C86] flex items-center justify-center shrink-0 border border-[#C4D9FF] shadow-2xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div>
                  <span className="font-extrabold block mb-0.5">Nellore Main Outlet</span>
                  <p className="text-xs sm:text-sm text-[#3D4A63] leading-relaxed">
                    {CONTACT_INFO.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-white text-[#0B5C86] flex items-center justify-center shrink-0 border border-[#C4D9FF] shadow-2xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <div>
                  <span className="font-extrabold block mb-0.5">Operating Hours</span>
                  <p className="text-xs sm:text-sm text-[#3D4A63]">
                    {CONTACT_INFO.hours} (Always Open for Farmers)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-white text-[#0B5C86] flex items-center justify-center shrink-0 border border-[#C4D9FF] shadow-2xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <div>
                  <span className="font-extrabold block mb-0.5">Direct Contacts</span>
                  <p className="text-xs sm:text-sm text-[#3D4A63]">
                    Karthik: <a href="tel:+918688566023" className="font-bold text-[#4338CA] hover:underline">+91 86885 66023</a>
                    <br />
                    Hazarathaiah: <a href="tel:+919177657576" className="font-bold text-[#4338CA] hover:underline">+91 91776 57576</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={CONTACT_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-6 rounded-full bg-[#0B1A33] text-white inline-flex items-center gap-2 font-extrabold text-sm hover:bg-[#24365A] transition-colors shadow-xs"
              >
                <span>Get Directions</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div className="lg:col-span-7 h-[320px] sm:h-[400px] rounded-[28px] overflow-hidden border border-[#C4D9FF] shadow-sm relative bg-white">
            <iframe
              title="Karthik Traders Store Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3863.027005479426!2d79.98202027589998!3d14.444391280521633!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4cf3b5a1bbefef%3A0xe54d9c7bb7d530f6!2sKarthik%20Traders!5e0!3m2!1sen!2sin!4v1711200000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
