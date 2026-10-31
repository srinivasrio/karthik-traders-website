'use client';

import Link from 'next/link';

export default function RefundPolicyPage() {
  const sections = [
    {
      n: '01',
      id: 'cancellation',
      h: 'Order Cancellation',
      ps: [
        'Orders can be cancelled free of charge within 24 hours of confirmation, provided the shipment has not yet left our Nellore warehouse.',
        'Once goods are loaded onto transport carriers with a consignment tracking note (LR copy), cancellation is no longer possible.',
      ],
    },
    {
      n: '02',
      id: 'damages',
      h: 'Damaged or Defective Items Replacement',
      ps: [
        'If any aerator set, motor, or spare part arrives damaged or with factory defects, report it within 3 days of delivery.',
        'Please share clear photos or short video clips on WhatsApp (+91 91776 57576). We immediately dispatch a replacement unit or replacement parts at zero cost.',
      ],
    },
    {
      n: '03',
      id: 'returns',
      h: 'Return Eligibility & Conditions',
      ps: [
        'Returns are accepted only for unused, uninstalled products in original protective packaging with all hardware kits intact.',
        'Custom-assembled aerator sets and electrical wiring cannot be refunded once delivered and installed.',
      ],
    },
    {
      n: '04',
      id: 'processing',
      h: 'Refund Processing Timelines',
      ps: [
        'Approved refunds are inspected at our Nellore warehouse and credited directly via NEFT / UPI within 5 to 7 business days.',
        'Nothing in this policy limits your statutory consumer protection rights under Indian law.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      {/* Header Banner */}
      <section className="bg-[#FBFBFB] pt-8 md:pt-14 pb-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#5B6880]">
            <Link href="/" className="hover:text-[#0B1A33]">Home</Link>
            <span>/</span>
            <span className="text-[#0B1A33] font-bold">Refund Policy</span>
          </nav>
          <span className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase">
            LEGAL POLICIES
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-poppins text-[#0B1A33] max-w-3xl leading-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-base sm:text-lg text-[#3D4A63] font-medium max-w-2xl leading-relaxed mt-1">
            Clear guidelines on order cancellations, defect replacements, and refund timelines.
          </p>

          {/* Legal Navigation Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/terms-conditions"
              className="h-9 px-4 rounded-full bg-white border border-[#D5DCE8] text-[#0B1A33] font-bold text-xs inline-flex items-center hover:bg-[#E8F9FF] transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy-policy"
              className="h-9 px-4 rounded-full bg-white border border-[#D5DCE8] text-[#0B1A33] font-bold text-xs inline-flex items-center hover:bg-[#E8F9FF] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/refund-policy"
              className="h-9 px-4 rounded-full bg-[#0B1A33] text-white font-extrabold text-xs inline-flex items-center shadow-xs"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          <nav
            aria-label="On this page"
            className="hidden lg:flex lg:col-span-4 sticky top-24 flex-col gap-1 border-l-2 border-[#E3E8F0] pl-4"
          >
            <span className="text-xs font-extrabold tracking-wider text-[#5B6880] uppercase mb-2">
              SECTIONS
            </span>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="py-1.5 text-xs sm:text-sm font-bold text-[#5B6880] hover:text-[#0B1A33] transition-colors"
              >
                {s.n}. {s.h}
              </a>
            ))}
          </nav>

          <div className="lg:col-span-8 flex flex-col gap-6">
            {sections.map((s) => (
              <article
                key={s.id}
                id={s.id}
                className="scroll-mt-24 p-6 sm:p-7 rounded-3xl bg-white border border-[#E3E8F0] shadow-2xs flex flex-col gap-3"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-extrabold text-[#4338CA]">
                    {s.n}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1A33] font-poppins">
                    {s.h}
                  </h2>
                </div>
                {s.ps.map((p, idx) => (
                  <p key={idx} className="text-sm sm:text-base text-[#3D4A63] leading-relaxed font-medium">
                    {p}
                  </p>
                ))}
              </article>
            ))}

            <div className="p-6 rounded-3xl bg-[#E8F9FF] border border-[#C4D9FF] flex flex-col gap-2 text-sm text-[#0B1A33]">
              <span className="font-extrabold text-base">Need to report a shipment issue?</span>
              <p className="text-xs sm:text-sm text-[#3D4A63] leading-relaxed">
                Contact Hazarathaiah directly on <a href="tel:+919177657576" className="font-bold text-[#4338CA]">+91 91776 57576</a> or via WhatsApp with photos of your shipment.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
